const supabase = require("../config/supabase");
const { createOAuthClient } = require("../config/googleOAuth");
const { signOAuthState, verifyOAuthState } = require("../services/oauthState.service");
const { listReportableCustomers, getGoogleAdsData } = require("../services/googleAds.service");

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

function googleLogin(req, res) {
  const oauth2Client = createOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/adwords"],
    state: signOAuthState(req.user.id, "google"),
  });
  res.json({ url });
}

async function googleCallback(req, res) {
  try {
    const code = req.query.code;
    if (!code) throw new Error("Google authorization code is missing");
    const companyId = verifyOAuthState(req.query.state, "google");

    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    const { customerIds, loginCustomerId } = await listReportableCustomers(tokens.access_token);

    const { error: upsertError } = await supabase.from("google_users").upsert([{
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      company_id: companyId,
      customer_ids: customerIds,
      selected_customer_id: loginCustomerId || customerIds[0] || null,
    }], { onConflict: "company_id" });
    if (upsertError) throw upsertError;

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const snapshotDate = yesterday.toISOString().slice(0, 10);
    for (const customerId of customerIds) {
      try {
        const campaigns = await getGoogleAdsData(customerId, tokens.access_token, snapshotDate, loginCustomerId);
        for (const campaign of campaigns) {
          await supabase.from("campaign_snapshots").upsert([{
            ad_account_id: customerId,
            external_campaign_id: campaign.campaign_id,
            company_id: companyId,
            platform: "google",
            campaign_name: campaign.campaign_name,
            spend: campaign.spend,
            ctr: campaign.ctr,
            cpc: campaign.cpc,
            impressions: campaign.impressions,
            clicks: campaign.clicks,
            snapshot_date: snapshotDate,
          }], { onConflict: "company_id,platform,ad_account_id,external_campaign_id,snapshot_date" });
        }
      } catch (syncError) {
        // Directly accessible manager accounts cannot always be queried for
        // campaign metrics. Continue so usable client accounts still sync.
        console.error(`Google Ads sync failed for ${customerId}:`, syncError.response?.data || syncError.message);
      }
    }

    res.redirect(`${frontendUrl}/dashboard?connected=google`);
  } catch (error) {
    console.error("Google callback error:", error.response?.data || error.message);
    res.redirect(`${frontendUrl}/dashboard?error=google_failed`);
  }
}

module.exports = { googleLogin, googleCallback };
