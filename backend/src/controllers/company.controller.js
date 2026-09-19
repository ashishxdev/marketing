const supabase = require("../config/supabase");

async function getCompany(req, res) {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(404).json({ error: "Company not found" });
  res.json(data);
}

async function updateCompany(req, res) {
  const { company_name, company_description } = req.body;
  if (!company_name?.trim()) return res.status(400).json({ error: "company_name required" });

  const { data, error } = await supabase
    .from("companies")
    .update({ company_name: company_name.trim(), company_description: company_description || "", updated_at: new Date().toISOString() })
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

module.exports = { getCompany, updateCompany };
