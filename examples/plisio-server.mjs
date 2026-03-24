import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const host = process.env.PLISIO_SERVER_HOST || '127.0.0.1';
const port = Number(process.env.PLISIO_SERVER_PORT || '8787');
const plisioSecretKey = process.env.PLISIO_SECRET_KEY || '';
const allowedCoins = process.env.PLISIO_ALLOWED_COINS || '';
const callbackUrl = process.env.PLISIO_CALLBACK_URL || '';

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  });
  response.end(JSON.stringify(data));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleCreateInvoice(request, response) {
  if (!plisioSecretKey) {
    sendJson(response, 500, { message: 'Missing PLISIO_SECRET_KEY.' });
    return;
  }

  const body = await readJsonBody(request);
  const orderNumber = `metaremover-${randomUUID()}`;
  const sourceAmount = Number(body.sourceAmount || 4.99);
  const sourceCurrency = String(body.sourceCurrency || 'USD');
  const orderName = String(body.orderName || 'MetaRemover Premium');
  const successReturnUrl = String(body.successReturnUrl || '');
  const failReturnUrl = String(body.failReturnUrl || '');

  const query = new URLSearchParams({
    source_currency: sourceCurrency,
    source_amount: String(sourceAmount),
    order_number: orderNumber,
    order_name: orderName,
    api_key: plisioSecretKey,
    expire_min: '60',
    return_existing: '1',
  });

  if (allowedCoins) {
    query.set('allowed_psys_cids', allowedCoins);
  }

  if (callbackUrl) {
    query.set('callback_url', callbackUrl);
  }

  if (successReturnUrl) {
    query.set('success_invoice_url', successReturnUrl);
  }

  if (failReturnUrl) {
    query.set('fail_invoice_url', failReturnUrl);
  }

  const plisioResponse = await fetch(`https://api.plisio.net/api/v1/invoices/new?${query.toString()}`);
  const plisioData = await plisioResponse.json();

  if (!plisioResponse.ok || plisioData?.status !== 'success') {
    sendJson(response, 500, {
      message: plisioData?.data?.message || 'Failed to create Plisio invoice.',
      providerResponse: plisioData,
    });
    return;
  }

  sendJson(response, 200, {
    invoiceUrl: plisioData.data.invoice_url,
    txnId: plisioData.data.txn_id,
  });
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 404, { message: 'Not found.' });
    return;
  }

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'POST' && request.url === '/api/plisio/create-invoice') {
    try {
      await handleCreateInvoice(request, response);
    } catch (error) {
      sendJson(response, 500, {
        message: error instanceof Error ? error.message : 'Unknown Plisio server error.',
      });
    }
    return;
  }

  sendJson(response, 404, { message: 'Not found.' });
});

server.listen(port, host, () => {
  console.log(`Plisio server running on http://${host}:${port}`);
});
