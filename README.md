# MetaRemover

## Plisio setup

`Plisio` uses a secret API key, so checkout must be created by a backend endpoint, not directly from the browser.

## Vercel setup

For `metaremover.tech` on `Vercel`, the project now includes ready API routes:

```text
api/auth/request-link.ts
api/auth/verify.ts
api/auth/logout.ts
api/premium/status.ts
api/usage/consume.ts
api/plisio/create-invoice.ts
api/plisio/webhook.ts
```

After deploy they become:

```text
https://www.metaremover.tech/api/plisio/create-invoice
https://www.metaremover.tech/api/plisio/webhook
```

### Vercel environment variables

Add these in Vercel Project Settings -> Environment Variables:

```text
DATABASE_URL=your_neon_database_url
PLISIO_SECRET_KEY=your_secret_key
PLISIO_PRICE_USD=4.99
PLISIO_PLAN_NAME=MetaRemover Premium
PLISIO_ALLOWED_COINS=BTC,ETH,USDT
PLISIO_CALLBACK_URL=https://www.metaremover.tech/api/plisio/webhook?json=true
PLISIO_SUCCESS_URL=https://www.metaremover.tech/
PLISIO_FAIL_URL=https://www.metaremover.tech/
PREMIUM_DURATION_DAYS=30
RESEND_API_KEY=your_resend_api_key
AUTH_FROM_EMAIL=MetaRemover <noreply@metaremover.tech>
```

`DATABASE_URL`, `PLISIO_SECRET_KEY` and `RESEND_API_KEY` are required for the full production flow.

### 1. Frontend env

Copy `.env.example` to `.env` and set:

```env
VITE_PLISIO_CREATE_INVOICE_URL=/api/plisio/create-invoice
VITE_PLISIO_PLAN_NAME=MetaRemover Premium
VITE_PLISIO_PRICE_USD=4.99
VITE_PLISIO_SUCCESS_URL=https://www.metaremover.tech/?provider=plisio&premium=success
VITE_PLISIO_FAIL_URL=https://www.metaremover.tech/?provider=plisio&premium=failed
```

### 2. Backend env

Before starting the example server set:

```powershell
$env:PLISIO_SECRET_KEY="your_secret_key"
$env:PLISIO_ALLOWED_COINS="BTC,ETH,USDT"
$env:PLISIO_CALLBACK_URL="https://www.metaremover.tech/api/plisio/webhook?json=true"
```

### 3. Run the example Plisio server

```powershell
npm run plisio:server
```

It exposes:

```text
POST https://www.metaremover.tech/api/plisio/create-invoice
```

### 4. Run the frontend

```powershell
npm run dev
```

or

```powershell
npm run build
npm run preview
```

### 5. Current frontend flow

- User clicks a premium feature.
- User enters an email for premium purchase or signs in with a one-time email code.
- Frontend opens the premium prompt.
- `Pay with Plisio` calls `VITE_PLISIO_CREATE_INVOICE_URL`.
- Backend creates a payment session, stores the purchaser email and returns `invoiceUrl`.
- Browser redirects to Plisio checkout.
- `Plisio` webhook activates premium on the backend after confirmed payment.
- Frontend reads account status from `/api/premium/status`.
- Free users can clean up at most 5 files per day through `/api/usage/consume`.
- After payment, frontend expects return params like:

```text
https://www.metaremover.tech/?provider=plisio&premium=success
```

Optional:

```text
https://www.metaremover.tech/?provider=plisio&premium=success&expires_at=1767225600000&txn_id=abc123
```

### Important

- The included `examples/plisio-server.mjs` is only a starter integration.
- On `Vercel`, prefer the built-in `api/plisio/*.ts` routes instead of the local example server.
- Premium is now stored on the backend and tied to email-based sign-in.
- Free daily quota is also enforced on the backend.
- Use one canonical domain everywhere. If the site opens on `www.metaremover.tech`, then Plisio callback and return URLs must also use `www.metaremover.tech`.
