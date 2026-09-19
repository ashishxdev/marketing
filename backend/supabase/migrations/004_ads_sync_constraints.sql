ALTER TABLE campaign_snapshots
  ADD COLUMN IF NOT EXISTS external_campaign_id TEXT;

-- Required for idempotent reconnects and daily sync retries.
DELETE FROM google_users
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at DESC, id DESC) AS row_number
    FROM google_users
    WHERE company_id IS NOT NULL
  ) duplicates
  WHERE row_number > 1
);

DELETE FROM ad_accounts
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, ad_account_id ORDER BY created_at DESC, id DESC) AS row_number
    FROM ad_accounts
  ) duplicates
  WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS google_users_company_id_key
  ON google_users (company_id);

CREATE UNIQUE INDEX IF NOT EXISTS ad_accounts_user_account_key
  ON ad_accounts (user_id, ad_account_id);

CREATE UNIQUE INDEX IF NOT EXISTS campaign_snapshots_daily_key
  ON campaign_snapshots (
    company_id,
    platform,
    ad_account_id,
    external_campaign_id,
    snapshot_date
  );
