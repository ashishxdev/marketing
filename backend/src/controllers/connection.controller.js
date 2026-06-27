const supabase = require("../config/supabase");

async function getConnectionStatus(req, res) {
  const [
    { data: metaUser, error: metaErr },
    { data: googleUser, error: googleErr },
  ] = await Promise.all([
    supabase.from("users").select("company_id").eq("company_id", req.user.id).limit(1),
    supabase.from("google_users").select("company_id").eq("company_id", req.user.id).limit(1),
  ]);

  if (metaErr) console.error("Meta connection status query error:", metaErr);
  if (googleErr) console.error("Google connection status query error:", googleErr);

  res.json({
    meta: (metaUser || []).length > 0,
    google: (googleUser || []).length > 0,
  });
}

module.exports = { getConnectionStatus };
