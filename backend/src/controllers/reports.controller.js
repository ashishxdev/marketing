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

async function testGenerateReport(req, res) {
  try {
    const companyId = req.query.company_id || "7b7c5017-10b9-4fae-ae9f-ecc6ef0cde3f";
    const platform = req.query.platform || "both";
    const period = req.query.period || "weekly";

    const { data: company, error: compErr } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (compErr || !company) {
      return res.status(404).json({ error: "Company profile not found. Please complete Settings first.", details: compErr });
    }

    const { data: snapshots, error: snapErr } = await supabase
      .from("campaign_snapshots")
      .select("*")
      .eq("company_id", companyId);

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

    console.log(`🤖 Testing Gemini analysis for ${company.company_name} with ${filteredSnapshots.length} snapshots on platform: ${platform}...`);

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
    console.error("Test report generator error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getReports, testGenerateReport };
