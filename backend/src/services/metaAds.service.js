const axios = require("axios");

async function getMetaAdsData(accountId, accessToken) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v23.0/${accountId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields: "campaign_name,spend,ctr,cpc,impressions,clicks",
          level: "campaign",
          date_preset: "yesterday",
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    return [];
  }
}

module.exports = getMetaAdsData;
