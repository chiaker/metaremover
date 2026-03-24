type PlisioCheckoutResponse = {
  invoiceUrl: string;
  txnId?: string;
  orderNumber?: string;
};

type PlisioReturnStatus = 'success' | 'failed' | 'cancelled';

type PlisioReturnState = {
  status: PlisioReturnStatus;
  expiresAt: number | null;
  txnId: string | null;
  orderNumber: string | null;
};

function normalizeExpiresAt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed < 1_000_000_000_000 ? parsed * 1000 : parsed;
}

function buildDefaultReturnUrl(status: PlisioReturnStatus): string {
  const url = new URL(window.location.href);
  url.searchParams.set('provider', 'plisio');
  url.searchParams.set('premium', status);
  return url.toString();
}

function getPlisioEndpoint(): string {
  return import.meta.env.VITE_PLISIO_CREATE_INVOICE_URL?.trim() || `${window.location.origin}/api/plisio/create-invoice`;
}

export function isPlisioConfigured(): boolean {
  return Boolean(getPlisioEndpoint());
}

export function getPlisioPlanLabel(): string {
  return import.meta.env.VITE_PLISIO_PLAN_NAME?.trim() || 'MetaRemover Premium';
}

export function getPlisioPriceLabel(): string {
  return import.meta.env.VITE_PLISIO_PRICE_USD?.trim() || '4.99';
}

export async function createPlisioInvoice(email: string): Promise<PlisioCheckoutResponse> {
  const endpoint = getPlisioEndpoint();

  if (!endpoint) {
    throw new Error('Plisio endpoint не настроен. Добавьте VITE_PLISIO_CREATE_INVOICE_URL.');
  }

  const successReturnUrl = import.meta.env.VITE_PLISIO_SUCCESS_URL?.trim() || buildDefaultReturnUrl('success');
  const failReturnUrl = import.meta.env.VITE_PLISIO_FAIL_URL?.trim() || buildDefaultReturnUrl('failed');
  const payload = {
    plan: 'premium-monthly',
    orderName: getPlisioPlanLabel(),
    sourceCurrency: 'USD',
    sourceAmount: Number(import.meta.env.VITE_PLISIO_PRICE_USD || '4.99'),
    successReturnUrl,
    failReturnUrl,
    email,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => null)) as
    | {
        invoiceUrl?: string;
        invoice_url?: string;
        txnId?: string;
        txn_id?: string;
        orderNumber?: string;
        order_number?: string;
        message?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(data?.message || 'Не удалось создать Plisio invoice.');
  }

  const invoiceUrl = data?.invoiceUrl || data?.invoice_url;

  if (!invoiceUrl) {
    throw new Error('Backend не вернул invoice_url от Plisio.');
  }

  return {
    invoiceUrl,
    txnId: data?.txnId || data?.txn_id,
    orderNumber: data?.orderNumber || data?.order_number,
  };
}

export function readPlisioReturnState(): PlisioReturnState | null {
  const params = new URLSearchParams(window.location.search);
  const provider = params.get('provider');
  const premium = params.get('premium');

  if (provider !== 'plisio' || !premium) {
    return null;
  }

  if (!['success', 'failed', 'cancelled'].includes(premium)) {
    return null;
  }

  return {
    status: premium as PlisioReturnStatus,
    expiresAt: normalizeExpiresAt(params.get('expires_at')),
    txnId: params.get('txn_id'),
    orderNumber: params.get('order_number'),
  };
}

export function clearPlisioReturnState(): void {
  const url = new URL(window.location.href);
  ['provider', 'premium', 'expires_at', 'txn_id', 'order_number'].forEach((key) => {
    url.searchParams.delete(key);
  });
  window.history.replaceState({}, document.title, url.toString());
}
