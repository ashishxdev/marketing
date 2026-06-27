const axios = require("axios");
const supabase = require("../config/supabase");
const getMetaAdsData = require("../services/metaAds.service");

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

function metaLogin(req, res) {
  const companyId = req.query.company_id || "";
  const loginUrl =
    `https://www.facebook.com/v23.0/dialog/oauth?` +
    `client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${process.env.REDIRECT_URI}` +
    `&config_id=${process.env.META_CONFIG_ID}` +
    `&state=${encodeURIComponent(companyId)}`;
  res.redirect(loginUrl);
}

async function metaCallback(req, res) {
  try {
    const code = req.query.code;
    const companyId = req.query.state || "";

    const tokenResponse = await axios.get(
      "https://graph.facebook.com/v23.0/oauth/access_token",
      { params: { client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, redirect_uri: process.env.REDIRECT_URI, code } }
    );
    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://graph.facebook.com/me", {
      params: { access_token: accessToken },
    });
    const facebookUserId = userResponse.data.id;

    if (companyId) {
      await supabase.from("companies").upsert([{
        id: companyId,
        company_name: "My Company",
        company_description: "",
      }]);
    }

    const { error: upsertError } = await supabase.from("users").upsert([{
      facebook_user_id: facebookUserId,
      access_token: accessToken,
      company_id: companyId || null,
    }]);
    if (upsertError) console.error("Meta token upsert database error:", upsertError);

    const adAccountsResponse = await axios.get(
      "https://graph.facebook.com/v23.0/me/adaccounts",
      { params: { access_token: accessToken } }
    );

    for (const account of adAccountsResponse.data.data || []) {
      await supabase.from("ad_accounts").upsert([{
        user_id: facebookUserId,
        ad_account_id: account.id,
        ad_account_name: account.name,
      }]);

      try {
        const campaigns = await getMetaAdsData(account.id, accessToken);
        if (campaigns && campaigns.length > 0) {
          for (const c of campaigns) {
            await supabase.from("campaign_snapshots").insert([{
              ad_account_id: account.id,
              company_id: companyId || null,
              platform: "meta",
              campaign_name: c.campaign_name,
              spend: c.spend || 0,
              ctr: c.ctr || 0,
              cpc: c.cpc || 0,
              impressions: c.impressions || 0,
              clicks: c.clicks || 0,
            }]);
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
    const payload = parts[1];
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    const facebookUserId = decodedPayload.user_id;

    if (!facebookUserId) return res.status(400).json({ error: "Invalid payload: user_id missing" });

    console.log(`🗑️ Meta data deletion requested for Facebook User ID: ${facebookUserId}`);

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
