import { buildReturnUrl, createOrderNumber, createPremiumExpiresAt, getPlisioConfig, sendJson } from './_shared.js';

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

  const expiresAt = createPremiumExpiresAt();
  const successUrl = buildReturnUrl(config.successUrl, 'success', expiresAt);
  const failUrl = buildReturnUrl(config.failUrl, 'failed', expiresAt);

  const query = new URLSearchParams({
    source_currency: config.sourceCurrency,
    source_amount: String(config.sourceAmount),
    order_number: createOrderNumber(),
    order_name: config.orderName,
    callback_url: config.callbackUrl,
    success_invoice_url: successUrl,
    fail_invoice_url: failUrl,
    expire_min: '60',
    return_existing: '1',
    api_key: config.apiKey,
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
  });
}
