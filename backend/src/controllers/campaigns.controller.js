const supabase = require("../config/supabase");

async function getCampaigns(req, res) {
  const platform = req.query.platform || "meta";
  const period = req.query.period || "daily";
  if (!["meta", "google"].includes(platform) || !["daily", "weekly"].includes(period)) {
    return res.status(400).json({ error: "Invalid platform or period" });
  }

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

module.exports = { getCampaigns };
