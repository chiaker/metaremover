# MetaRemover

## Plisio setup

`Plisio` uses a secret API key, so checkout must be created by a backend endpoint, not directly from the browser.

### 1. Frontend env

Copy `.env.example` to `.env` and set:

```env
VITE_PLISIO_CREATE_INVOICE_URL=http://127.0.0.1:8787/api/plisio/create-invoice
VITE_PLISIO_PLAN_NAME=MetaRemover Premium
VITE_PLISIO_PRICE_USD=4.99
VITE_PLISIO_SUCCESS_URL=http://127.0.0.1:5173/?provider=plisio&premium=success
VITE_PLISIO_FAIL_URL=http://127.0.0.1:5173/?provider=plisio&premium=failed
```

### 2. Backend env

Before starting the example server set:

```powershell
$env:PLISIO_SECRET_KEY="your_secret_key"
$env:PLISIO_ALLOWED_COINS="BTC,ETH,USDT"
$env:PLISIO_CALLBACK_URL="https://your-domain.com/api/plisio/webhook?json=true"
```

### 3. Run the example Plisio server

```powershell
npm run plisio:server
```

It exposes:

```text
POST http://127.0.0.1:8787/api/plisio/create-invoice
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
- Frontend opens the premium prompt.
- `Pay with Plisio` calls `VITE_PLISIO_CREATE_INVOICE_URL`.
- Backend creates a Plisio invoice and returns `invoiceUrl`.
- Browser redirects to Plisio checkout.
- After payment, frontend expects return params like:

```text
?provider=plisio&premium=success
```

Optional:

```text
?provider=plisio&premium=success&expires_at=1767225600000&txn_id=abc123
```

### Important

- The included `examples/plisio-server.mjs` is only a starter integration.
- For production you should verify Plisio callbacks on the backend and unlock premium only after confirmed payment.
- Current app stores premium state in `localStorage`, so a full production-grade premium system still needs auth and backend persistence.
