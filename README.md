# AdPulse AI

AdPulse AI connects one signed-in company to Meta Ads and Google Ads, stores daily campaign snapshots, and generates Gemini-powered daily and weekly reports.

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.
2. In Supabase, run the SQL files in `backend/supabase/migrations` in numeric order.
3. Set `SUPABASE_SERVICE_KEY` only on the backend. Never expose it as a `NEXT_PUBLIC_*` variable.
4. Set a long random `OAUTH_STATE_SECRET` (for example, `openssl rand -hex 32`).
5. Start the backend with `cd backend && npm install && npm run dev`.
6. Start the frontend with `cd frontend && npm install && npm run dev`.

The frontend defaults to port 3001 and the backend to port 3000. `GET /health` returns the backend health status.

## Connect Meta Ads

1. Create a Meta developer app and configure Facebook Login for Business.
2. Create a login configuration requesting `ads_read` and `business_management`; put its ID in `META_CONFIG_ID`.
3. Add `${BASE_URL}/callback` as an exact valid OAuth redirect URI and set the same URL in `REDIRECT_URI`.
4. Configure `${BASE_URL}/api/meta-delete-user` as the user-data deletion callback and `${FRONTEND_URL}/privacy` as the privacy-policy URL.
5. For users outside the app's roles, complete Meta App Review and request Advanced Access for the required permissions.

After signup, open Dashboard → Settings → Connected Accounts → Connect Meta. The callback stores the long-lived user token, discovers ad accounts, and imports yesterday's campaign metrics.

## Connect Google Ads

1. Create or select a Google Cloud project, enable the Google Ads API, and configure the OAuth consent screen.
2. Create a Web application OAuth client and add `${BASE_URL}/callback-google` as an authorized redirect URI.
3. Put the OAuth client ID and secret in the backend environment.
4. In Google Cloud Console's Google Ads API Overview, make sure the project has the access level needed for the accounts you will query. New integrations no longer apply for a developer token; an existing token may remain in the optional environment variable.
5. Add the production frontend/backend domains to the OAuth consent configuration and publish or verify the app when required.

Then use Dashboard → Settings → Connected Accounts → Connect Google. The app requests offline access, discovers directly accessible advertiser accounts and manager-account clients, and imports yesterday's campaign metrics.

## Reports

- The daily job runs at 09:00 in `CRON_TIMEZONE` (UTC by default) and creates separate Meta and Google reports when those platforms have data.
- The weekly job runs Mondays at 10:00 and creates a combined seven-day report.
- The AI Reports tab can generate a combined weekly report immediately.
- Scheduled jobs require the backend process to remain running. On a sleeping/serverless host, move the schedules to the host's cron service and call protected job endpoints instead.
- Reports require `GEMINI_API_KEY` and at least one stored campaign snapshot.

## Verification

```sh
cd backend && npm test && npm audit --omit=dev
cd frontend && npx next build --webpack && npm audit --omit=dev
```
