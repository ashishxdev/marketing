DROP POLICY IF EXISTS "companies_isolation" ON companies;
CREATE POLICY "companies_isolation" ON companies
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "meta_users_isolation" ON users;
CREATE POLICY "meta_users_isolation" ON users
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "google_users_isolation" ON google_users;
CREATE POLICY "google_users_isolation" ON google_users
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "ad_accounts_isolation" ON ad_accounts;
CREATE POLICY "ad_accounts_isolation" ON ad_accounts
  FOR ALL
  USING (
    user_id IN (
      SELECT facebook_user_id FROM users WHERE company_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "snapshots_isolation" ON campaign_snapshots;
CREATE POLICY "snapshots_isolation" ON campaign_snapshots
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

DROP POLICY IF EXISTS "reports_isolation" ON ai_reports;
CREATE POLICY "reports_isolation" ON ai_reports
  FOR ALL
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());
