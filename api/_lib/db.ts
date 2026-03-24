import { neon } from '@neondatabase/serverless';

let schemaReadyPromise: Promise<void> | null = null;

function getDatabaseUrl() {
  return process.env.DATABASE_URL || '';
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

export function getSql() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL in environment variables.');
  }

  return neon(databaseUrl);
}

export async function ensureSchema() {
  if (!hasDatabase()) {
    return;
  }

  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const sql = getSql();

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS auth_codes (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          consumed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS payment_sessions (
          order_number TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          plan TEXT NOT NULL,
          status TEXT NOT NULL,
          txn_id TEXT,
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS premium_entitlements (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          provider TEXT NOT NULL,
          provider_txn_id TEXT UNIQUE,
          status TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS daily_usage (
          subject_key TEXT NOT NULL,
          usage_date DATE NOT NULL,
          files_processed INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (subject_key, usage_date)
        )
      `;
    })();
  }

  await schemaReadyPromise;
}
