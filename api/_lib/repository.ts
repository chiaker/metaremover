import { ensureSchema, getSql, hasDatabase } from './db.js';

type UserRow = {
  id: number;
  email: string;
};

type PremiumRow = {
  active: boolean;
  expiresAt: number | null;
};

type SessionRow = {
  userId: number;
  email: string;
  premiumStatus: string | null;
  premiumExpiresAt: string | null;
};

export async function getOrCreateUserByEmail(email: string) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    INSERT INTO users (email)
    VALUES (${email})
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id, email
  `) as UserRow[];

  return rows[0] ?? null;
}

export async function createAuthCode(email: string, codeHash: string, expiresAt: Date) {
  if (!hasDatabase()) {
    return;
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO auth_codes (email, code_hash, expires_at)
    VALUES (${email}, ${codeHash}, ${expiresAt.toISOString()})
  `;
}

export async function getLatestActiveAuthCode(email: string) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, code_hash AS "codeHash", expires_at AS "expiresAt"
    FROM auth_codes
    WHERE email = ${email}
      AND consumed_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `) as Array<{ id: number; codeHash: string; expiresAt: string }>;

  return rows[0] ?? null;
}

export async function consumeAuthCode(id: number) {
  if (!hasDatabase()) {
    return;
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    UPDATE auth_codes
    SET consumed_at = NOW()
    WHERE id = ${id}
  `;
}

export async function createAuthSession(userId: number, tokenHash: string, expiresAt: Date) {
  if (!hasDatabase()) {
    return;
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO auth_sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
  `;
}

export async function deleteAuthSession(tokenHash: string) {
  if (!hasDatabase()) {
    return;
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    DELETE FROM auth_sessions
    WHERE token_hash = ${tokenHash}
  `;
}

export async function getSessionByTokenHash(tokenHash: string) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT
      s.user_id AS "userId",
      u.email AS "email",
      p.status AS "premiumStatus",
      p.expires_at AS "premiumExpiresAt"
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN premium_entitlements p ON p.user_id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
    LIMIT 1
  `) as SessionRow[];

  return rows[0] ?? null;
}

export async function createPaymentSession(input: {
  orderNumber: string;
  email: string;
  plan: string;
  status: string;
  expiresAt: Date | null;
}) {
  if (!hasDatabase()) {
    return;
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO payment_sessions (order_number, email, plan, status, expires_at)
    VALUES (${input.orderNumber}, ${input.email}, ${input.plan}, ${input.status}, ${input.expiresAt?.toISOString() ?? null})
  `;
}

export async function updatePaymentSession(input: { orderNumber: string; status: string; txnId?: string | null; expiresAt?: Date | null }) {
  if (!hasDatabase()) {
    return;
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    UPDATE payment_sessions
    SET
      status = ${input.status},
      txn_id = COALESCE(${input.txnId ?? null}, txn_id),
      expires_at = COALESCE(${input.expiresAt?.toISOString() ?? null}, expires_at),
      updated_at = NOW()
    WHERE order_number = ${input.orderNumber}
  `;
}

export async function getPaymentSession(orderNumber: string) {
  if (!hasDatabase()) {
    return null;
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT order_number AS "orderNumber", email, plan, status, txn_id AS "txnId", expires_at AS "expiresAt"
    FROM payment_sessions
    WHERE order_number = ${orderNumber}
    LIMIT 1
  `) as Array<{ orderNumber: string; email: string; plan: string; status: string; txnId: string | null; expiresAt: string | null }>;

  return rows[0] ?? null;
}

export async function upsertPremiumEntitlement(input: {
  userId: number;
  provider: string;
  providerTxnId: string | null;
  status: string;
  expiresAt: Date;
}) {
  if (!hasDatabase()) {
    return;
  }

  await ensureSchema();
  const sql = getSql();

  await sql`
    INSERT INTO premium_entitlements (user_id, provider, provider_txn_id, status, expires_at)
    VALUES (${input.userId}, ${input.provider}, ${input.providerTxnId}, ${input.status}, ${input.expiresAt.toISOString()})
    ON CONFLICT (user_id) DO UPDATE
    SET
      provider = EXCLUDED.provider,
      provider_txn_id = EXCLUDED.provider_txn_id,
      status = EXCLUDED.status,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `;
}

export async function getPremiumStatus(userId: number): Promise<PremiumRow> {
  if (!hasDatabase()) {
    return {
      active: false,
      expiresAt: null,
    };
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT status, expires_at AS "expiresAt"
    FROM premium_entitlements
    WHERE user_id = ${userId}
    LIMIT 1
  `) as Array<{ status: string; expiresAt: string | null }>;

  const row = rows[0];

  if (!row || row.status !== 'active' || !row.expiresAt) {
    return {
      active: false,
      expiresAt: null,
    };
  }

  const expiresAt = new Date(row.expiresAt).getTime();

  return {
    active: expiresAt > Date.now(),
    expiresAt: expiresAt > Date.now() ? expiresAt : null,
  };
}

export async function getDailyUsage(subjectKey: string, usageDate: string) {
  if (!hasDatabase()) {
    return 0;
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    SELECT files_processed AS "filesProcessed"
    FROM daily_usage
    WHERE subject_key = ${subjectKey}
      AND usage_date = ${usageDate}
    LIMIT 1
  `) as Array<{ filesProcessed: number }>;

  return rows[0]?.filesProcessed ?? 0;
}

export async function incrementDailyUsage(subjectKey: string, usageDate: string, count: number) {
  if (!hasDatabase()) {
    return count;
  }

  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO daily_usage (subject_key, usage_date, files_processed)
    VALUES (${subjectKey}, ${usageDate}, ${count})
    ON CONFLICT (subject_key, usage_date) DO UPDATE
    SET
      files_processed = daily_usage.files_processed + EXCLUDED.files_processed,
      updated_at = NOW()
    RETURNING files_processed AS "filesProcessed"
  `) as Array<{ filesProcessed: number }>;

  return rows[0]?.filesProcessed ?? count;
}
