CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        TEXT NOT NULL,
  company_description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  facebook_user_id TEXT PRIMARY KEY,
  access_token     TEXT NOT NULL,
  company_id       UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token         TEXT NOT NULL,
  refresh_token        TEXT,
  company_id           UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_ids         TEXT[],
  selected_customer_id TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT REFERENCES users(facebook_user_id) ON DELETE CASCADE,
  ad_account_id   TEXT NOT NULL,
  ad_account_name TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id  TEXT,
  company_id     UUID REFERENCES companies(id) ON DELETE CASCADE,
  platform       TEXT NOT NULL,
  campaign_name  TEXT,
  spend          NUMERIC DEFAULT 0,
  ctr            NUMERIC DEFAULT 0,
  cpc            NUMERIC DEFAULT 0,
  impressions    BIGINT DEFAULT 0,
  clicks         BIGINT DEFAULT 0,
  snapshot_date  DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  period      TEXT NOT NULL,
  report_json JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
