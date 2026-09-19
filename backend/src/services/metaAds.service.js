const axios = require("axios");

async function getMetaAdsData(accountId, accessToken) {
  const response = await axios.get(
    `https://graph.facebook.com/v23.0/${accountId}/insights`,
    {
      params: {
        access_token: accessToken,
        fields: "campaign_id,campaign_name,spend,ctr,cpc,impressions,clicks",
        level: "campaign",
        date_preset: "yesterday",
        limit: 500,
      },
    }
  );
  return response.data.data || [];
}

module.exports = getMetaAdsData;
