import { buildReturnUrl, createOrderNumber, createPremiumExpiresAt, getPlisioConfig, sendJson } from './_shared.js';
import { createPaymentSession } from '../_lib/repository.js';
import { isValidEmail } from '../_lib/session.js';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  const config = getPlisioConfig(request);
  const email = String(request.body?.email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    sendJson(response, 400, { message: 'A valid email is required for premium purchase.' });
    return;
  }

  if (!config.apiKey) {
    sendJson(response, 500, { message: 'Missing PLISIO_SECRET_KEY in Vercel environment variables.' });
    return;
  }

  const expiresAt = createPremiumExpiresAt();
  const orderNumber = createOrderNumber();
  const successUrl = buildReturnUrl(config.successUrl, 'success', expiresAt, { order_number: orderNumber });
  const failUrl = buildReturnUrl(config.failUrl, 'failed', expiresAt, { order_number: orderNumber });

  await createPaymentSession({
    orderNumber,
    email,
    plan: 'premium-monthly',
    status: 'created',
    expiresAt: new Date(expiresAt),
  });

  const query = new URLSearchParams({
    source_currency: config.sourceCurrency,
    source_amount: String(config.sourceAmount),
    order_number: orderNumber,
    order_name: config.orderName,
    callback_url: config.callbackUrl,
    success_invoice_url: successUrl,
    fail_invoice_url: failUrl,
    expire_min: '60',
    return_existing: '1',
    api_key: config.apiKey,
    email,
  });

  if (config.allowedCoins) {
    query.set('allowed_psys_cids', config.allowedCoins);
  }

  const providerResponse = await fetch(`https://api.plisio.net/api/v1/invoices/new?${query.toString()}`);
  const providerData = await providerResponse.json();

  if (!providerResponse.ok || providerData?.status !== 'success') {
    sendJson(response, 500, {
      message: providerData?.data?.message || 'Plisio invoice creation failed.',
      providerResponse: providerData,
    });
    return;
  }

  sendJson(response, 200, {
    invoiceUrl: providerData.data.invoice_url,
    txnId: providerData.data.txn_id,
    expiresAt,
    orderNumber,
  });
}
