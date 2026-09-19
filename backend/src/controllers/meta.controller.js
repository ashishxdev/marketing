const axios = require("axios");
const supabase = require("../config/supabase");
const getMetaAdsData = require("../services/metaAds.service");
const { signOAuthState, verifyOAuthState } = require("../services/oauthState.service");

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

function metaLogin(req, res) {
  const state = signOAuthState(req.user.id, "meta");
  const loginUrl =
    `https://www.facebook.com/v23.0/dialog/oauth?` +
    `client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&config_id=${encodeURIComponent(process.env.META_CONFIG_ID)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}`;
  res.json({ url: loginUrl });
}

async function metaCallback(req, res) {
  try {
    const code = req.query.code;
    const companyId = verifyOAuthState(req.query.state, "meta");

    const tokenResponse = await axios.get(
      "https://graph.facebook.com/v23.0/oauth/access_token",
      { params: { client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, redirect_uri: process.env.REDIRECT_URI, code } }
    );
    const shortLivedToken = tokenResponse.data.access_token;
    const longLivedResponse = await axios.get(
      "https://graph.facebook.com/v23.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      }
    );
    const accessToken = longLivedResponse.data.access_token || shortLivedToken;

    const userResponse = await axios.get("https://graph.facebook.com/me", {
      params: { access_token: accessToken },
    });
    const facebookUserId = userResponse.data.id;

    const { error: upsertError } = await supabase.from("users").upsert([{
      facebook_user_id: facebookUserId,
      access_token: accessToken,
      company_id: companyId || null,
    }]);
    if (upsertError) console.error("Meta token upsert database error:", upsertError);

    const adAccountsResponse = await axios.get(
      "https://graph.facebook.com/v23.0/me/adaccounts",
      { params: { access_token: accessToken, fields: "id,name", limit: 500 } }
    );

    for (const account of adAccountsResponse.data.data || []) {
      await supabase.from("ad_accounts").upsert([{
        user_id: facebookUserId,
        ad_account_id: account.id,
        ad_account_name: account.name,
      }], { onConflict: "user_id,ad_account_id" });

      try {
        const campaigns = await getMetaAdsData(account.id, accessToken);
        if (campaigns && campaigns.length > 0) {
          for (const c of campaigns) {
            await supabase.from("campaign_snapshots").upsert([{
              ad_account_id: account.id,
              external_campaign_id: c.campaign_id,
              company_id: companyId,
              platform: "meta",
              campaign_name: c.campaign_name,
              spend: c.spend || 0,
              ctr: c.ctr || 0,
              cpc: c.cpc || 0,
              impressions: c.impressions || 0,
              clicks: c.clicks || 0,
            }], { onConflict: "company_id,platform,ad_account_id,external_campaign_id,snapshot_date" });
          }
          console.log(`✅ Stored ${campaigns.length} campaigns for account ${account.id}`);
        }
      } catch (campaignErr) {
        console.error(`Failed to fetch campaigns for account ${account.id}:`, campaignErr.message);
      }
    }

    res.redirect(`${frontendUrl}/dashboard?connected=meta`);
  } catch (error) {
    console.error("Meta callback error:", error.response?.data || error.message);
    res.redirect(`${frontendUrl}/dashboard?error=meta_failed`);
  }
}

async function metaDeleteUser(req, res) {
  try {
    const signedRequest = req.body.signed_request;
    if (!signedRequest) return res.status(400).json({ error: "Missing signed_request" });

    const parts = signedRequest.split(".");
    if (parts.length !== 2) return res.status(400).json({ error: "Invalid signed_request" });
    const [encodedSignature, payload] = parts;
    const crypto = require("crypto");
    const expected = crypto.createHmac("sha256", process.env.META_APP_SECRET).update(payload).digest();
    const actual = Buffer.from(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return res.status(400).json({ error: "Invalid signed_request signature" });
    }
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    const facebookUserId = decodedPayload.user_id;

    if (!facebookUserId) return res.status(400).json({ error: "Invalid payload: user_id missing" });

    const { data: metaUser } = await supabase
      .from("users")
      .select("company_id")
      .eq("facebook_user_id", facebookUserId)
      .maybeSingle();
    if (metaUser?.company_id) {
      await Promise.all([
        supabase.from("campaign_snapshots").delete().eq("company_id", metaUser.company_id).eq("platform", "meta"),
        supabase.from("ai_reports").delete().eq("company_id", metaUser.company_id).eq("platform", "meta"),
      ]);
    }
    await supabase.from("users").delete().eq("facebook_user_id", facebookUserId);

    res.json({
      url: `${frontendUrl}/privacy`,
      confirmation_code: `del_${facebookUserId}_${Date.now()}`,
    });
  } catch (err) {
    console.error("Meta data deletion error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { metaLogin, metaCallback, metaDeleteUser };
