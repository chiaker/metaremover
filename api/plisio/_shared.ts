import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export function sendJson(response: any, statusCode: number, payload: unknown) {
  response.status(statusCode).json(payload);
}

export function getBaseUrl(request: any): string {
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers['x-forwarded-host'] || request.headers.host || 'metaremover.tech';
  return `${protocol}://${host}`;
}

export function buildReturnUrl(
  urlString: string,
  status: 'success' | 'failed',
  expiresAt: number,
  extraParams: Record<string, string | number | null | undefined> = {},
) {
  const url = new URL(urlString);
  url.searchParams.set('provider', 'plisio');
  url.searchParams.set('premium', status);
  url.searchParams.set('expires_at', String(expiresAt));

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function createPremiumExpiresAt() {
  const days = Number(process.env.PREMIUM_DURATION_DAYS || '30');
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

export function createOrderNumber() {
  return `metaremover-${randomUUID()}`;
}

export function getPlisioConfig(request: any) {
  const baseUrl = getBaseUrl(request);

  return {
    apiKey: process.env.PLISIO_SECRET_KEY || '',
    sourceCurrency: process.env.PLISIO_SOURCE_CURRENCY || 'USD',
    sourceAmount: Number(process.env.PLISIO_PRICE_USD || '4.99'),
    orderName: process.env.PLISIO_PLAN_NAME || 'MetaRemover Premium',
    allowedCoins: process.env.PLISIO_ALLOWED_COINS || '',
    callbackUrl: process.env.PLISIO_CALLBACK_URL || `${baseUrl}/api/plisio/webhook?json=true`,
    successUrl: process.env.PLISIO_SUCCESS_URL || `${baseUrl}/`,
    failUrl: process.env.PLISIO_FAIL_URL || `${baseUrl}/`,
  };
}

export function verifyPlisioCallback(payload: Record<string, unknown>, secretKey: string) {
  const verifyHash = typeof payload.verify_hash === 'string' ? payload.verify_hash : '';

  if (!verifyHash || !secretKey) {
    return false;
  }

  const orderedPayload = { ...payload };
  delete orderedPayload.verify_hash;

  const sortedPayload = Object.keys(orderedPayload)
    .sort()
    .reduce<Record<string, unknown>>((accumulator, key) => {
      accumulator[key] = orderedPayload[key];
      return accumulator;
    }, {});

  const digest = createHmac('sha1', secretKey).update(JSON.stringify(sortedPayload)).digest('hex');
  return timingSafeEqual(Buffer.from(digest), Buffer.from(verifyHash));
}
