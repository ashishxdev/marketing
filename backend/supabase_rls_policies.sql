-- ============================================================
-- AdPulse AI — Supabase Row Level Security Policies
-- Run this entire file in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ─── STEP 1: Enable RLS on all tables ────────────────────────
ALTER TABLE companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts        ENABLE ROW LEVEL SECURITY;


-- ─── STEP 2: COMPANIES table ─────────────────────────────────
-- Each user can only see/edit their own company row
-- (company.id = supabase auth user id)

DROP POLICY IF EXISTS "companies_isolation" ON companies;
CREATE POLICY "companies_isolation" ON companies
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ─── STEP 3: CAMPAIGN_SNAPSHOTS table ────────────────────────
-- Each company can only see their own campaign snapshots

DROP POLICY IF EXISTS "snapshots_isolation" ON campaign_snapshots;
CREATE POLICY "snapshots_isolation" ON campaign_snapshots
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());


-- ─── STEP 4: AI_REPORTS table ────────────────────────────────
-- Each company can only see their own AI reports

DROP POLICY IF EXISTS "reports_isolation" ON ai_reports;
CREATE POLICY "reports_isolation" ON ai_reports
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());


-- ─── STEP 5: USERS table (Meta connections) ──────────────────
-- Each company can only see their own Meta/Facebook connection

DROP POLICY IF EXISTS "meta_users_isolation" ON users;
CREATE POLICY "meta_users_isolation" ON users
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());


-- ─── STEP 6: GOOGLE_USERS table ──────────────────────────────
-- Each company can only see their own Google connection

DROP POLICY IF EXISTS "google_users_isolation" ON google_users;
CREATE POLICY "google_users_isolation" ON google_users
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());


-- ─── STEP 7: AD_ACCOUNTS table ───────────────────────────────
-- Accessible only if the facebook_user_id belongs to the logged-in company
-- We join through the users table to get company_id

DROP POLICY IF EXISTS "ad_accounts_isolation" ON ad_accounts;
CREATE POLICY "ad_accounts_isolation" ON ad_accounts
  FOR ALL
  USING (
    user_id IN (
      SELECT facebook_user_id FROM users WHERE company_id = auth.uid()
    )
  );


-- ─── STEP 8: SERVICE ROLE BYPASS (automatic) ─────────────────
-- IMPORTANT: The service_role key bypasses ALL RLS automatically.
-- Your backend should use service_role key so cron jobs work.
-- Anon key = subject to RLS (for frontend/users)
-- Service role key = bypasses RLS (for your backend server only)

-- To verify RLS is enabled, run:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
