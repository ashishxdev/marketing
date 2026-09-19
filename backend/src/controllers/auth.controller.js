const { createClient } = require("@supabase/supabase-js");

// Use service role key to bypass email confirmation
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * POST /api/auth/signup
 * Body: { email, password, company_name, company_description }
 *
 * Creates an auto-confirmed auth user, then creates the company profile.
 */
async function signup(req, res) {
  const { email, password, company_name, company_description } = req.body;

  if (!email || !password || !company_name) {
    return res.status(400).json({ error: "email, password, and company_name are required" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  // 1. Create auth user using admin API (auto-confirms email)
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation
  });

  if (authErr) {
    // Handle duplicate email gracefully
    if (authErr.message?.toLowerCase().includes("already registered") ||
        authErr.message?.toLowerCase().includes("already exists")) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    return res.status(500).json({ error: authErr.message });
  }

  const userId = authData.user.id;

  // 2. Insert company row (id = auth user id)
  const { error: companyErr } = await supabaseAdmin.from("companies").insert({
    id: userId,
    company_name,
    company_description: company_description || "",
  });

  if (companyErr) {
    // Rollback: delete the auth user so we don't leave orphans
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return res.status(500).json({ error: "Failed to create company profile: " + companyErr.message });
  }

  // 3. Sign in to get a session token for the frontend
  const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    return res.status(500).json({ error: "Account created but sign-in failed: " + signInErr.message });
  }

  return res.status(201).json({
    user: signInData.user,
    session: signInData.session,
  });
}

module.exports = { signup };
