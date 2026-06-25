# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AdPulse AI** — a Node.js/Express multi-tenant SaaS backend for marketing analytics. Integrates with Meta/Facebook Ads and Google Ads APIs, uses Supabase PostgreSQL for data storage with Row Level Security, and leverages Google Gemini AI to generate actionable campaign insights on a scheduled basis. Deployed on Railway.app.

## Commands

```bash
npm start          # Start the server (node server.js)
npm run dev        # Same as start (no hot-reload)
```

There is no test suite, linter, or build step configured. The project is plain JavaScript (no TypeScript, no transpilation).

## Architecture

The entire backend is a flat set of files — no `src/` directory or nested structure:

- **server.js** — Main Express app: all routes, middleware, OAuth flows, cron jobs (~500 lines)
- **supabase.js** — Exports two Supabase clients: `supabase` (anon key, subject to RLS) and `supabaseAdmin` (service role key, bypasses RLS for cron jobs)
- **metaAds.js** — Meta Graph API v23.0 helpers: fetches ad accounts and campaign insights (spend, CTR, CPC, impressions, clicks)
- **gemini.js** — Gemini 2.5 Flash integration: takes campaign snapshots + company context, returns structured JSON report with winners/losers/recommendations/scaling_opportunities
- **index.js** — Utility/initialization (Telegram bot helper, currently unused in main server)

## Key Patterns

### Authentication
All `/api/*` routes use `requireAuth` middleware that validates Supabase JWT Bearer tokens. The authenticated user's ID becomes `req.user.id`, which maps to `companies.id` for tenant isolation.

### Multi-tenancy
Data isolation is enforced at two levels:
1. **Application level**: Queries filter by `company_id = req.user.id`
2. **Database level**: Supabase RLS policies (defined in `supabase_rls_policies.sql`) ensure users can only access their own company's data. The service role key bypasses RLS for cron/admin operations.

### OAuth Flows
- **Meta**: `/login` → Facebook OAuth → `/callback` → stores token in `users` table, fetches ad accounts + campaign snapshots
- **Google**: `/google-login` → Google OAuth → `/callback-google` → stores tokens in `google_users` table, lists accessible customer IDs
- Both flows accept `company_id` as a query param and redirect back to `FRONTEND_URL` with `?connected=meta|google`

### Cron Jobs (node-cron)
- **Daily 9 AM** (`0 9 * * *`): For each company with a Meta connection, fetches yesterday's campaign insights, stores snapshots, generates a Gemini AI daily report
- **Weekly Monday 10 AM** (`0 10 * * 1`): Aggregates past 7 days of snapshots across platforms, generates a weekly report

### AI Report Pipeline
`gemini.js` → `analyzeAds(snapshots, companyDescription)` → calls Gemini 2.5 Flash → returns JSON:
```json
{
  "winners": [{"campaign": "...", "reason": "..."}],
  "losers": [{"campaign": "...", "reason": "..."}],
  "recommendations": ["..."],
  "scaling_opportunities": ["..."]
}
```

## Database Tables

| Table | Purpose | Key fields |
|-------|---------|-----------|
| `companies` | Tenant root (PK = Supabase user ID) | company_name, company_description |
| `users` | Meta OAuth connections | facebook_user_id, access_token, company_id |
| `google_users` | Google OAuth connections | access_token, refresh_token, company_id, customer_ids, selected_customer_id |
| `ad_accounts` | Meta ad accounts | user_id, ad_account_id, ad_account_name |
| `campaign_snapshots` | Time-series campaign metrics | company_id, platform, campaign_name, spend, ctr, cpc, impressions, clicks, snapshot_date |
| `ai_reports` | Generated Gemini analyses | company_id, platform, period, report_json |

## Environment Variables

Required in `.env`:
- `SUPABASE_URL`, `SUPABASE_KEY` (anon), `SUPABASE_SERVICE_KEY` (service role)
- `PORT`, `BASE_URL`, `FRONTEND_URL`
- `META_APP_ID`, `META_APP_SECRET`, `META_CONFIG_ID`, `REDIRECT_URI`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ADS_DEVELOPER_TOKEN` (optional, enables customer ID listing)
- `GEMINI_API_KEY`

## Deployment

Railway.app with NIXPACKS builder. Requires Node.js >= 20 (for WebSocket support in Supabase client). Config in `railway.json`.
