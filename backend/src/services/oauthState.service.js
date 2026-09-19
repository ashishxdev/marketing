const crypto = require("crypto");

const MAX_STATE_AGE_MS = 10 * 60 * 1000;

function getSecret() {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_KEY;
  if (!secret) throw new Error("OAUTH_STATE_SECRET is not configured");
  return secret;
}

function signOAuthState(companyId, platform) {
  const payload = Buffer.from(JSON.stringify({ companyId, platform, issuedAt: Date.now() }))
    .toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyOAuthState(state, expectedPlatform) {
  const [payload, signature] = String(state || "").split(".");
  if (!payload || !signature) throw new Error("Invalid OAuth state");

  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new Error("Invalid OAuth state signature");
  }

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!parsed.companyId || parsed.platform !== expectedPlatform) throw new Error("Invalid OAuth state payload");
  if (!parsed.issuedAt || Date.now() - parsed.issuedAt > MAX_STATE_AGE_MS) throw new Error("OAuth state expired");
  return parsed.companyId;
}

module.exports = { signOAuthState, verifyOAuthState };
