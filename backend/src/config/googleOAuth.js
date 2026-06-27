require("dotenv").config();
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.BASE_URL}/callback-google`,
});

module.exports = oauth2Client;
