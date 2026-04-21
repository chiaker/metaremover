Here is the restructured and concise English version:

---

# MetaRemover

A service for removing metadata with premium access and Plisio crypto payments. 

**Important:** Premium status and free limits (5 files/day) are controlled on the backend and tied to email-based auth. Plisio payments must be created on the backend (the secret key is never exposed to the client). Always use a single canonical domain (e.g., `www.metaremover.tech`) for all callbacks and return URLs.

---

## 🌍 Environment Variables

### Backend (Vercel / Local Server)
Required variables for production are marked in bold.

*   **`DATABASE_URL`** — Neon database URL.
*   **`PLISIO_SECRET_KEY`** — Plisio API secret key.
*   **`RESEND_API_KEY`** — API key for sending emails (Resend).
*   `PLISIO_PRICE_USD` — Price (default: `4.99`).
*   `PLISIO_PLAN_NAME` — Plan name (default: `MetaRemover Premium`).
*   `PLISIO_ALLOWED_COINS` — Allowed cryptocurrencies (e.g., `BTC,ETH,USDT`).
*   `PLISIO_CALLBACK_URL` — Plisio webhook URL (`https://www.metaremover.tech/api/plisio/webhook?json=true`).
*   `PLISIO_SUCCESS_URL` — Redirect URL after successful payment (`https://www.metaremover.tech/`).
*   `PLISIO_FAIL_URL` — Redirect URL after failed payment (`https://www.metaremover.tech/`).
*   `PREMIUM_DURATION_DAYS` — Premium duration in days (`30`).
*   `AUTH_FROM_EMAIL` — Sender email (`MetaRemover <noreply@metaremover.tech>`).

### Frontend
Copy `.env.example` to `.env` and configure:

```env
VITE_PLISIO_CREATE_INVOICE_URL=/api/plisio/create-invoice
VITE_PLISIO_PLAN_NAME=MetaRemover Premium
VITE_PLISIO_PRICE_USD=4.99
VITE_PLISIO_SUCCESS_URL=https://www.metaremover.tech/?provider=plisio&premium=success
VITE_PLISIO_FAIL_URL=https://www.metaremover.tech/?provider=plisio&premium=failed
```

---

## 🚀 Vercel Deployment (Production)

On Vercel, built-in API routes from the `api/` directory are used. The local example server (`examples/plisio-server.mjs`) is **not needed**.

1. Add all backend environment variables in *Vercel Project Settings -> Environment Variables*.
2. Upon deployment, Vercel automatically creates the following endpoints:
   * `/api/auth/request-link.ts`
   * `/api/auth/verify.ts`
   * `/api/auth/logout.ts`
   * `/api/premium/status.ts`
   * `/api/usage/consume.ts`
   * `/api/plisio/create-invoice.ts`
   * `/api/plisio/webhook.ts`

---

## 🛠 Local Development

If running locally, the backend is served via a standalone server from the `examples/` directory.

1. Set the backend environment variables in your terminal:
   ```bash
   $env:PLISIO_SECRET_KEY="your_secret_key"
   $env:PLISIO_ALLOWED_COINS="BTC,ETH,USDT"
   $env:PLISIO_CALLBACK_URL="https://www.metaremover.tech/api/plisio/webhook?json=true"
   # ...and other backend variables
   ```
2. Start the local backend (exposes `POST /api/plisio/create-invoice`):
   ```bash
   npm run plisio:server
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
   *(Or use `npm run build` and `npm run preview` to test the production build).*

---
6. User returns to the site with URL parameters: `?provider=plisio&premium=success` (optionally, `expires_at` and `txn_id` may be appended).
7. Frontend verifies the account status via `/api/premium/status`.
8. For free users, the daily limit (5 files) is enforced via `/api/usage/consume`.
