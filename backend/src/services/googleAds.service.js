const axios = require("axios");
const { createOAuthClient } = require("../config/googleOAuth");

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v25";
const API_BASE = `https://googleads.googleapis.com/${API_VERSION}`;

function requestHeaders(accessToken, loginCustomerId) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  // Developer tokens were sunset in September 2026. Existing tokens are still
  // accepted and ignored, so keep this optional for older Google Ads projects.
  if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    headers["developer-token"] = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  }
  if (loginCustomerId) headers["login-customer-id"] = String(loginCustomerId).replace(/\D/g, "");
  return headers;
}

async function getFreshGoogleCredentials(storedCredentials) {
  const client = createOAuthClient();
  client.setCredentials({
    access_token: storedCredentials.access_token,
    refresh_token: storedCredentials.refresh_token,
  });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Google did not return an access token");
  return token;
}

async function listAccessibleCustomers(accessToken) {
  const response = await axios.get(`${API_BASE}/customers:listAccessibleCustomers`, {
    headers: requestHeaders(accessToken),
  });
  return response.data.resourceNames || [];
}

async function listReportableCustomers(accessToken) {
  const directlyAccessible = await listAccessibleCustomers(accessToken);
  const customerIds = new Set(directlyAccessible.map((name) => name.replace("customers/", "")));
  let loginCustomerId = null;

  for (const rootCustomerId of [...customerIds]) {
    try {
      const response = await axios.post(
        `${API_BASE}/customers/${rootCustomerId}/googleAds:searchStream`,
        {
          query: `
            SELECT
              customer_client.id,
              customer_client.manager,
              customer_client.status
            FROM customer_client
            WHERE customer_client.status = 'ENABLED'
          `,
        },
        { headers: requestHeaders(accessToken) }
      );
      for (const batch of response.data || []) {
        for (const row of batch.results || []) {
          if (!row.customerClient?.manager && row.customerClient?.id) {
            customerIds.add(String(row.customerClient.id));
            if (String(row.customerClient.id) !== rootCustomerId) loginCustomerId ||= rootCustomerId;
          }
        }
      }
    } catch (error) {
      // A normal advertiser account may not expose a customer-client tree.
      // It remains in the result and will still be queried directly.
    }
  }
  return { customerIds: [...customerIds], loginCustomerId };
}

async function getGoogleAdsData(customerId, accessToken, date, loginCustomerId = null) {
  const normalizedCustomerId = String(customerId).replace(/\D/g, "");
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date = '${date}'
      AND campaign.status != 'REMOVED'
  `;

  const response = await axios.post(
    `${API_BASE}/customers/${normalizedCustomerId}/googleAds:searchStream`,
    { query },
    { headers: requestHeaders(accessToken, loginCustomerId && loginCustomerId !== normalizedCustomerId ? loginCustomerId : null) }
  );

  return (response.data || []).flatMap((batch) => batch.results || []).map((row) => ({
    campaign_id: String(row.campaign?.id || ""),
    campaign_name: row.campaign?.name || "Unnamed campaign",
    status: row.campaign?.status || "UNKNOWN",
    spend: Number(row.metrics?.costMicros || 0) / 1_000_000,
    impressions: Number(row.metrics?.impressions || 0),
    clicks: Number(row.metrics?.clicks || 0),
    ctr: Number(row.metrics?.ctr || 0) * 100,
    cpc: Number(row.metrics?.averageCpc || 0) / 1_000_000,
  }));
}

module.exports = { getFreshGoogleCredentials, listAccessibleCustomers, listReportableCustomers, getGoogleAdsData };
