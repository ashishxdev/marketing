# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Build & Dev Commands

```bash
npm run dev      # Start dev server (Turbopack, port 3000)
npm run build    # Production build
npm run start    # Start production server
```

No test framework is configured. No linter CLI is set up beyond Next.js built-in checks during build.

## Environment Variables

Required `NEXT_PUBLIC_*` variables (browser-exposed):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `NEXT_PUBLIC_API_URL` — Backend Express API URL (defaults to `http://localhost:3000`)

## Architecture

**AdPulse AI** — A SaaS dashboard for unified ad campaign analytics across Meta and Google Ads, with AI-generated reports powered by Google Gemini.

### Stack
- **Next.js 16** (App Router, Turbopack) with **React 19** — all pages use `'use client'`
- **Supabase** — auth only (email/password signup + session management)
- **Tailwind CSS 4** — dark theme with brand colors (purple `#7c6af7`, cyan `#00d4ff`)
- **Recharts** — chart visualizations on the dashboard

### Frontend ↔ Backend Split

The frontend is a thin client. A **separate Express backend** handles all business logic, OAuth flows, database operations, and third-party API calls. The frontend communicates via `lib/api.js`, which wraps `fetch()` calls with Bearer token auth from the Supabase session.

Backend endpoints the frontend calls: `/api/company`, `/api/accounts`, `/api/campaigns`, `/api/reports`, `/api/connection-status`. OAuth redirects go directly to the backend at `/login` (Meta) and `/google-login` (Google).

### Key Files

- `lib/supabase.js` — Supabase client singleton, `getSession()` and `getUser()` helpers
- `lib/api.js` — `apiFetch()` wrapper and all backend API call functions
- `app/dashboard/page.js` — Main application page with tabs: Overview, Meta Ads, Google Ads, AI Reports, Settings
- `app/login/page.js` — Auth page handling signup (with company creation) and signin
- `app/page.js` — Marketing landing page
- `components/Toast.js` — Toast notification system using React Context

### Patterns

- **Auth flow**: Supabase `auth.getSession()` → extract access token → pass as Bearer header to all backend API calls
- **State**: Plain `useState` hooks, no external state library. Toast uses React Context.
- **Data fetching**: `useEffect` + `fetch()` via `lib/api.js` helpers. No server components or SSR data fetching — everything loads client-side.
- **Path aliases**: `@/*` maps to project root (configured in `jsconfig.json`)
