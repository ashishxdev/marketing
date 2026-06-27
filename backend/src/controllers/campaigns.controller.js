const supabase = require("../config/supabase");

async function getAccounts(req, res) {
  const { data: metaUser } = await supabase
    .from("users")
    .select("facebook_user_id")
    .eq("company_id", req.user.id)
    .single();

  if (!metaUser) return res.json([]);

  const { data: accounts } = await supabase
    .from("ad_accounts")
    .select("*")
    .eq("user_id", metaUser.facebook_user_id);

  res.json(accounts || []);
}

async function getCampaigns(req, res) {
  const platform = req.query.platform || "meta";
  const period = req.query.period || "daily";

  const daysBack = period === "weekly" ? 7 : 1;
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceStr = since.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("campaign_snapshots")
    .select("*")
    .eq("company_id", req.user.id)
    .eq("platform", platform)
    .gte("snapshot_date", sinceStr)
    .order("snapshot_date", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

module.exports = { getAccounts, getCampaigns };
