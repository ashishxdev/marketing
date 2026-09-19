const cron = require("node-cron");
const supabase = require("../config/supabase");
const getMetaAdsData = require("../services/metaAds.service");
const analyzeAds = require("../services/gemini.service");
const { getFreshGoogleCredentials, getGoogleAdsData } = require("../services/googleAds.service");

function yesterdayUtc() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

async function storeSnapshots(companyId, platform, accountId, campaigns, snapshotDate) {
  for (const campaign of campaigns) {
    const { error } = await supabase.from("campaign_snapshots").upsert([{
      ad_account_id: accountId,
      external_campaign_id: campaign.campaign_id,
      company_id: companyId,
      platform,
      campaign_name: campaign.campaign_name,
      spend: campaign.spend || 0,
      ctr: campaign.ctr || 0,
      cpc: campaign.cpc || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      snapshot_date: snapshotDate,
    }], { onConflict: "company_id,platform,ad_account_id,external_campaign_id,snapshot_date" });
    if (error) throw error;
  }
}

cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Running Daily Marketing Analysis...");

  const { data: companies } = await supabase.from("companies").select("*");
  if (!companies?.length) return;

  for (const company of companies) {
    try {
      const snapshotDate = yesterdayUtc();
      const { data: metaUser } = await supabase
        .from("users")
        .select("*")
        .eq("company_id", company.id)
        .single();

      let metaCampaigns = [];

      if (metaUser) {
        const { data: accounts } = await supabase
          .from("ad_accounts")
          .select("*")
          .eq("user_id", metaUser.facebook_user_id);

        for (const account of accounts || []) {
          const campaigns = await getMetaAdsData(account.ad_account_id, metaUser.access_token);
          await storeSnapshots(company.id, "meta", account.ad_account_id, campaigns, snapshotDate);
          metaCampaigns.push(...campaigns);
        }

        if (metaCampaigns.length > 0) {
          const analysis = await analyzeAds(metaCampaigns, company.company_description, "Meta");
          await supabase.from("ai_reports").insert([{
            company_id: company.id,
            platform: "meta",
            period: "daily",
            report_json: analysis,
          }]);
        }
      }

      const { data: googleUser } = await supabase
        .from("google_users")
        .select("*")
        .eq("company_id", company.id)
        .maybeSingle();

      if (googleUser) {
        const accessToken = await getFreshGoogleCredentials(googleUser);
        const googleCampaigns = [];
        for (const customerId of googleUser.customer_ids || []) {
          try {
            const campaigns = await getGoogleAdsData(
              customerId,
              accessToken,
              snapshotDate,
              googleUser.selected_customer_id
            );
            await storeSnapshots(company.id, "google", customerId, campaigns, snapshotDate);
            googleCampaigns.push(...campaigns);
          } catch (accountError) {
            console.error(`Google daily sync failed for account ${customerId}:`, accountError.response?.data || accountError.message);
          }
        }

        if (googleCampaigns.length > 0) {
          const analysis = await analyzeAds(googleCampaigns, company.company_description, "Google");
          await supabase.from("ai_reports").insert([{
            company_id: company.id,
            platform: "google",
            period: "daily",
            report_json: analysis,
          }]);
        }
      }
    } catch (err) {
      console.error(`Error processing company ${company.company_name}:`, err.message);
    }
  }
}, { timezone: process.env.CRON_TIMEZONE || "UTC" });

cron.schedule("0 10 * * 1", async () => {
  console.log("📊 Running Weekly Marketing Report...");

  const { data: companies } = await supabase.from("companies").select("*");
  if (!companies?.length) return;

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString().split("T")[0];

  for (const company of companies) {
    try {
      const { data: snapshots } = await supabase
        .from("campaign_snapshots")
        .select("*")
        .eq("company_id", company.id)
        .gte("snapshot_date", sinceStr);

      if (!snapshots?.length) continue;

      const analysis = await analyzeAds(snapshots, company.company_description, "Meta and Google");
      await supabase.from("ai_reports").insert([{
        company_id: company.id,
        platform: "both",
        period: "weekly",
        report_json: analysis,
      }]);
    } catch (err) {
      console.error(`Weekly error for ${company.company_name}:`, err.message);
    }
  }
}, { timezone: process.env.CRON_TIMEZONE || "UTC" });
