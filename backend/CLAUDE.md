# Backend notes

AdPulse AI uses Express 5, Supabase, Meta Marketing API, Google Ads API, Gemini, and node-cron. Code lives under `src/`; SQL migrations live under `supabase/migrations`.

## Commands

```bash
npm run dev
npm test
npm audit --omit=dev
```

## Important patterns

- Supabase bearer tokens are checked by `src/middleware/auth.js`. Tenant-owned queries use `req.user.id` as `company_id`.
- The backend uses the Supabase service key; it must never be sent to the browser.
- Authenticated connection endpoints `/api/connections/meta` and `/api/connections/google` return provider authorization URLs. Provider callbacks validate a signed, ten-minute OAuth state before linking an account.
- Meta callback: `/callback`. Google callback: `/callback-google`. Meta deletion callback: `/api/meta-delete-user`.
- Google tokens are refreshed for scheduled jobs. Google Ads API version is configurable with `GOOGLE_ADS_API_VERSION`.
- Daily jobs sync and report both platforms. Weekly jobs report the previous seven days. Timezone comes from `CRON_TIMEZONE` and defaults to UTC.
- `campaign_snapshots` writes are idempotent via the unique key added in migration 004.

See the root `README.md` and `.env.example` for complete setup and provider-console requirements.
