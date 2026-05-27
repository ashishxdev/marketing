require("dotenv").config();

const express = require("express");
const axios   = require("axios");
const cron    = require("node-cron");
const cors    = require("cors");
const { google } = require("googleapis");

const supabase        = require("./supabase");
const getMetaAdsData  = require("./metaAds");
const analyzeAds      = require("./gemini");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
app.use(cors({ origin: ["http://localhost:3001", frontendUrl], credentials: true }));
app.use(express.json());

// ─── GOOGLE OAUTH CLIENT ─────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL}/callback-google`
);

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });
  req.user  = user;
  req.token = token;
  next();
}

// ─── COMPANY ROUTES ───────────────────────────────────────────

// POST /api/company — create on signup
app.post("/api/company", requireAuth, async (req, res) => {
  const { company_name, company_description } = req.body;
  if (!company_name) return res.status(400).json({ error: "company_name required" });

  const { data, error } = await supabase.from("companies").upsert([{
    id: req.user.id,
    company_name,
    company_description: company_description || "",
  }]).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/company
app.get("/api/company", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", req.user.id)
    .single();
  if (error) return res.status(404).json({ error: "Company not found" });
  res.json(data);
});

// PUT /api/company
app.put("/api/company", requireAuth, async (req, res) => {
  const { company_name, company_description } = req.body;
  const { data, error } = await supabase
    .from("companies")
    .update({ company_name, company_description, updated_at: new Date().toISOString() })
    .eq("id", req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── CONNECTION STATUS ────────────────────────────────────────
app.get("/api/connection-status", requireAuth, async (req, res) => {
  const [{ data: metaUser }, { data: googleUser }] = await Promise.all([
    supabase.from("users").select("company_id").eq("company_id", req.user.id).limit(1),
    supabase.from("google_users").select("company_id").eq("company_id", req.user.id).limit(1),
  ]);
  res.json({
    meta:   (metaUser   || []).length > 0,
    google: (googleUser || []).length > 0,
  });
});

// ─── AD ACCOUNTS ──────────────────────────────────────────────
app.get("/api/accounts", requireAuth, async (req, res) => {
  const { data: metaUser } = await supabase
    .from("users").select("facebook_user_id").eq("company_id", req.user.id).single();

  if (!metaUser) return res.json([]);

  const { data: accounts } = await supabase
    .from("ad_accounts")
    .select("*")
    .eq("user_id", metaUser.facebook_user_id);

  res.json(accounts || []);
});

// ─── CAMPAIGNS ────────────────────────────────────────────────
app.get("/api/campaigns", requireAuth, async (req, res) => {
  const platform = req.query.platform || "meta";
  const period   = req.query.period   || "daily";

  let daysBack = period === "weekly" ? 7 : 1;
  const since  = new Date();
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
});

// ─── AI REPORTS ───────────────────────────────────────────────
app.get("/api/reports", requireAuth, async (req, res) => {
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
});

// ─── META OAUTH ───────────────────────────────────────────────
app.get("/login", (req, res) => {
  const companyId = req.query.company_id || "";
  const loginUrl =
    `https://www.facebook.com/v23.0/dialog/oauth?` +
    `client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${process.env.REDIRECT_URI}` +
    `&config_id=${process.env.META_CONFIG_ID}` +
    `&state=${encodeURIComponent(companyId)}`;
  res.redirect(loginUrl);
});

app.get("/callback", async (req, res) => {
  try {
    const code      = req.query.code;
    const companyId = req.query.state || "";

    // Exchange code for token
    const tokenResponse = await axios.get(
      "https://graph.facebook.com/v23.0/oauth/access_token",
      { params: { client_id: process.env.META_APP_ID, client_secret: process.env.META_APP_SECRET, redirect_uri: process.env.REDIRECT_URI, code } }
    );
    const accessToken = tokenResponse.data.access_token;

    // Get FB user
    const userResponse = await axios.get("https://graph.facebook.com/me", { params: { access_token: accessToken } });
    const facebookUserId = userResponse.data.id;

    // Upsert user with company_id
    await supabase.from("users").upsert([{
      facebook_user_id: facebookUserId,
      access_token: accessToken,
      company_id: companyId || null,
    }]);

    // Get and save ad accounts
    const adAccountsResponse = await axios.get("https://graph.facebook.com/v23.0/me/adaccounts", {
      params: { access_token: accessToken }
    });
    for (const account of adAccountsResponse.data.data || []) {
      await supabase.from("ad_accounts").upsert([{
        user_id: facebookUserId,
        ad_account_id: account.id,
        ad_account_name: account.name,
      }]);

      // Fetch and save campaigns immediately so data shows up instantly in Supabase
      try {
        const campaigns = await getMetaAdsData(account.id, accessToken);
        if (campaigns && campaigns.length > 0) {
          for (const c of campaigns) {
            await supabase.from("campaign_snapshots").insert([{
              ad_account_id:  account.id,
              company_id:     companyId || null,
              platform:       "meta",
              campaign_name:  c.campaign_name,
              spend:          c.spend || 0,
              ctr:            c.ctr   || 0,
              cpc:            c.cpc   || 0,
              impressions:    c.impressions || 0,
              clicks:         c.clicks || 0,
            }]);
          }
          console.log(`✅ Stored ${campaigns.length} campaigns for account ${account.id} in Supabase`);
        }
      } catch (campaignErr) {
        console.error(`Failed to fetch campaigns for account ${account.id}:`, campaignErr.message);
      }
    }

    // Redirect back to dashboard
    res.redirect(`${frontendUrl}/dashboard?connected=meta`);
  } catch (error) {
    console.error("Meta callback error:", error.response?.data || error.message);
    res.redirect(`${frontendUrl}/dashboard?error=meta_failed`);
  }
});

// ─── GOOGLE OAUTH ─────────────────────────────────────────────
app.get("/google-login", (req, res) => {
  const companyId = req.query.company_id || "";
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/adwords"],
    state: companyId,
  });
  res.redirect(url);
});

app.get("/callback-google", async (req, res) => {
  try {
    const code      = req.query.code;
    const companyId = req.query.state || "";

    const { tokens } = await oauth2Client.getToken(code);

    // Try to list accessible Google Ads customers
    let customerIds = [];
    try {
      const listRes = await axios.get(
        "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
          },
        }
      );
      customerIds = listRes.data.resourceNames || [];
    } catch (e) {
      console.log("Could not list Google Ads customers:", e.message);
    }

    await supabase.from("google_users").upsert([{
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      company_id:    companyId || null,
      customer_ids:  customerIds,
      selected_customer_id: customerIds[0]?.replace("customers/", "") || null,
    }]);

    res.redirect(`${frontendUrl}/dashboard?connected=google`);
  } catch (error) {
    console.error("Google callback error:", error.message);
    res.redirect(`${frontendUrl}/dashboard?error=google_failed`);
  }
});

// ─── CRON: DAILY REPORT (9 AM) ───────────────────────────────
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Running Daily Marketing Analysis...");

  const { data: companies } = await supabase.from("companies").select("*");
  if (!companies?.length) return;

  for (const company of companies) {
    try {
      // META campaigns
      const { data: metaUser } = await supabase
        .from("users").select("*").eq("company_id", company.id).single();

      let metaCampaigns = [];
      if (metaUser) {
        const { data: accounts } = await supabase
          .from("ad_accounts").select("*").eq("user_id", metaUser.facebook_user_id);

        for (const account of accounts || []) {
          const campaigns = await getMetaAdsData(account.ad_account_id, metaUser.access_token);
          for (const c of campaigns) {
            await supabase.from("campaign_snapshots").insert([{
              ad_account_id:  account.ad_account_id,
              company_id:     company.id,
              platform:       "meta",
              campaign_name:  c.campaign_name,
              spend:          c.spend || 0,
              ctr:            c.ctr   || 0,
              cpc:            c.cpc   || 0,
              impressions:    c.impressions || 0,
              clicks:         c.clicks || 0,
            }]);
          }
          metaCampaigns.push(...campaigns);
        }

        if (metaCampaigns.length > 0) {
          const analysis = await analyzeAds(metaCampaigns, company.company_description, "Meta");
          await supabase.from("ai_reports").insert([{
            company_id:  company.id,
            platform:    "meta",
            period:      "daily",
            report_json: analysis,
          }]);
        }
      }

      // GOOGLE campaigns (placeholder — add googleAds.js logic here)
      // const { data: googleUser } = await supabase.from("google_users").select("*").eq("company_id", company.id).single();
      // if (googleUser) { ... }

    } catch (err) {
      console.error(`Error processing company ${company.company_name}:`, err.message);
    }
  }
});

// ─── CRON: WEEKLY REPORT (Monday 10 AM) ──────────────────────
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
        company_id:  company.id,
        platform:    "both",
        period:      "weekly",
        report_json: analysis,
      }]);

    } catch (err) {
      console.error(`Weekly error for ${company.company_name}:`, err.message);
    }
  }
});


// ─── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ AdPulse AI backend running on port ${PORT}`);
});