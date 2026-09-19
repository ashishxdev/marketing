const supabase = require("../config/supabase");
const analyzeAds = require("../services/gemini.service");

async function getReports(req, res) {
  const platform = req.query.platform;

  let query = supabase
    .from("ai_reports")
    .select("*")
    .eq("company_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (platform && platform !== "all") query = query.eq("platform", platform);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

async function generateReport(req, res) {
  try {
    const companyId = req.user.id;
    const platform = req.body.platform || "both";
    const period = req.body.period || "weekly";
    if (!["meta", "google", "both"].includes(platform) || !["daily", "weekly"].includes(period)) {
      return res.status(400).json({ error: "Invalid platform or period" });
    }

    const { data: company, error: compErr } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (compErr || !company) {
      return res.status(404).json({ error: "Company profile not found. Please complete Settings first.", details: compErr });
    }

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (period === "weekly" ? 7 : 1));
    const { data: snapshots, error: snapErr } = await supabase
      .from("campaign_snapshots")
      .select("*")
      .eq("company_id", companyId)
      .gte("snapshot_date", since.toISOString().slice(0, 10));

    if (snapErr || !snapshots?.length) {
      return res.status(400).json({ error: "No campaign snapshots found in database.", details: snapErr });
    }

    let filteredSnapshots = snapshots;
    if (platform !== "both") {
      filteredSnapshots = snapshots.filter((s) => s.platform === platform);
    }

    if (!filteredSnapshots.length) {
      return res.status(400).json({ error: `No campaign snapshots found for platform: ${platform}` });
    }

    console.log(`🤖 Generating analysis for ${company.company_name} with ${filteredSnapshots.length} snapshots on platform: ${platform}...`);

    const analysis = await analyzeAds(
      filteredSnapshots,
      company.company_description || "E-commerce advertising campaigns",
      platform
    );

    const { error: insertErr } = await supabase.from("ai_reports").insert([{
      company_id: companyId,
      platform,
      period,
      report_json: analysis,
    }]);

    if (insertErr) {
      return res.status(500).json({ error: "Failed to store generated report", details: insertErr });
    }

    res.json({
      success: true,
      message: `${platform.toUpperCase()} AI Report generated and stored under period: ${period}!`,
      report: analysis,
    });
  } catch (err) {
    console.error("Report generator error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getReports, generateReport };
