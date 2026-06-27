const cron = require("node-cron");
const supabase = require("../config/supabase");
const getMetaAdsData = require("../services/metaAds.service");
const analyzeAds = require("../services/gemini.service");

cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Running Daily Marketing Analysis...");

  const { data: companies } = await supabase.from("companies").select("*");
  if (!companies?.length) return;

  for (const company of companies) {
    try {
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
          for (const c of campaigns) {
            await supabase.from("campaign_snapshots").insert([{
              ad_account_id: account.ad_account_id,
              company_id: company.id,
              platform: "meta",
              campaign_name: c.campaign_name,
              spend: c.spend || 0,
              ctr: c.ctr || 0,
              cpc: c.cpc || 0,
              impressions: c.impressions || 0,
              clicks: c.clicks || 0,
            }]);
          }
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
    } catch (err) {
      console.error(`Error processing company ${company.company_name}:`, err.message);
    }
  }
});

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

      const analysis = await analyzeAds(snapshots, company.company_description, "both");
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
});
