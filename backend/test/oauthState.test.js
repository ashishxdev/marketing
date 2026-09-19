const test = require("node:test");
const assert = require("node:assert/strict");
const { signOAuthState, verifyOAuthState } = require("../src/services/oauthState.service");

test("OAuth state round-trips for the intended platform", () => {
  process.env.OAUTH_STATE_SECRET = "test-secret";
  const state = signOAuthState("company-123", "google");
  assert.equal(verifyOAuthState(state, "google"), "company-123");
});

test("OAuth state rejects tampering and cross-platform reuse", () => {
  process.env.OAUTH_STATE_SECRET = "test-secret";
  const state = signOAuthState("company-123", "meta");
  assert.throws(() => verifyOAuthState(`${state}x`, "meta"));
  assert.throws(() => verifyOAuthState(state, "google"));
});
