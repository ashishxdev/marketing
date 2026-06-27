const axios = require("axios");
const supabase = require("../config/supabase");
const oauth2Client = require("../config/googleOAuth");

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

function googleLogin(req, res) {
  const companyId = req.query.company_id || "";
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/adwords"],
    state: companyId,
  });
  res.redirect(url);
}

async function googleCallback(req, res) {
  try {
    const code = req.query.code;
    const companyId = req.query.state || "";

    const { tokens } = await oauth2Client.getToken(code);

    let customerIds = [];
    if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
      try {
        const listRes = await axios.get(
          "https://googleads.googleapis.com/v24/customers:listAccessibleCustomers",
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
            },
          }
        );
        customerIds = listRes.data.resourceNames || [];
      } catch (e) {
        console.log(
          "Could not list Google Ads customers:",
          e.response?.data?.error ? JSON.stringify(e.response.data.error, null, 2) : e.message
        );
      }
    } else {
      console.log("ℹ️ Skipping Google Ads account listing: GOOGLE_ADS_DEVELOPER_TOKEN not set.");
    }

    if (companyId) {
      await supabase.from("companies").upsert([{
        id: companyId,
        company_name: "My Company",
        company_description: "",
      }]);
    }

    const { error: upsertError } = await supabase.from("google_users").upsert([{
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      company_id: companyId || null,
      customer_ids: customerIds,
      selected_customer_id: customerIds[0]?.replace("customers/", "") || null,
    }]);
    if (upsertError) console.error("Google token upsert database error:", upsertError);

    res.redirect(`${frontendUrl}/dashboard?connected=google`);
  } catch (error) {
    console.error("Google callback error:", error.message);
    res.redirect(`${frontendUrl}/dashboard?error=google_failed`);
  }
}

module.exports = { googleLogin, googleCallback };
