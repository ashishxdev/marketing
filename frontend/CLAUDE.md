# Frontend notes

@AGENTS.md

AdPulse AI uses Next.js 16 App Router, React 19, Supabase Auth, Tailwind CSS 4, and Recharts.

## Commands

```bash
npm run dev                 # port 3001
npm run build
npx next build --webpack    # useful in sandboxes that block Turbopack workers
npm run start               # port 3001
```

## Architecture

- `lib/supabase.js` owns the browser Supabase client.
- `lib/api.js` owns authenticated backend requests.
- `app/login/page.js` signs in with Supabase and signs up through the backend so the auth user and company profile are created together.
- `app/dashboard/page.js` contains overview, per-platform ads, reports, and settings. OAuth begins by fetching a signed provider URL from `/api/connections/:platform`; never append a raw company ID to an OAuth URL.
- The frontend only receives `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_URL`. Never expose a service key.

See the root `README.md` and `.env.example` for setup.
