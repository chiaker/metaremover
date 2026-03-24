import { getPlisioConfig, sendJson, verifyPlisioCallback } from './_shared';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  const config = getPlisioConfig(request);

  if (!config.apiKey) {
    sendJson(response, 500, { message: 'Missing PLISIO_SECRET_KEY in Vercel environment variables.' });
    return;
  }

  const payload = typeof request.body === 'object' && request.body ? request.body : {};

  if (!verifyPlisioCallback(payload, config.apiKey)) {
    sendJson(response, 422, { message: 'Invalid Plisio verify_hash.' });
    return;
  }

  const status = payload.status;

  if (status === 'completed') {
    sendJson(response, 200, {
      ok: true,
      message: 'Plisio payment confirmed.',
      status,
      orderNumber: payload.order_number ?? null,
      txnId: payload.txn_id ?? null,
    });
    return;
  }

  sendJson(response, 200, {
    ok: true,
    message: 'Plisio callback accepted.',
    status,
    orderNumber: payload.order_number ?? null,
    txnId: payload.txn_id ?? null,
  });
}
