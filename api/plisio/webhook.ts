import { getPlisioConfig, sendJson, verifyPlisioCallback } from './_shared.js';
import { getOrCreateUserByEmail, getPaymentSession, updatePaymentSession, upsertPremiumEntitlement } from '../_lib/repository.js';

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
  const orderNumber = typeof payload.order_number === 'string' ? payload.order_number : '';
  const txnId = typeof payload.txn_id === 'string' ? payload.txn_id : null;

  if (!verifyPlisioCallback(payload, config.apiKey)) {
    sendJson(response, 422, { message: 'Invalid Plisio verify_hash.' });
    return;
  }

  const status = payload.status;

  if (orderNumber) {
    await updatePaymentSession({
      orderNumber,
      status: typeof status === 'string' ? status : 'unknown',
      txnId,
    });
  }

  if (status === 'completed') {
    const paymentSession = orderNumber ? await getPaymentSession(orderNumber) : null;

    if (paymentSession?.email) {
      const user = await getOrCreateUserByEmail(paymentSession.email);

      if (user && paymentSession.expiresAt) {
        await upsertPremiumEntitlement({
          userId: user.id,
          provider: 'plisio',
          providerTxnId: txnId,
          status: 'active',
          expiresAt: new Date(paymentSession.expiresAt),
        });
      }
    }

    sendJson(response, 200, {
      ok: true,
      message: 'Plisio payment confirmed.',
      status,
      orderNumber: orderNumber || null,
      txnId,
    });
    return;
  }

  sendJson(response, 200, {
    ok: true,
    message: 'Plisio callback accepted.',
    status,
    orderNumber: orderNumber || null,
    txnId,
  });
}
