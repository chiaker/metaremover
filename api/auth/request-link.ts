import { sendSignInCodeEmail } from '../_lib/mail.js';
import { createAuthCode } from '../_lib/repository.js';
import { generateOneTimeCode, hashValue } from '../_lib/security.js';
import { isValidEmail } from '../_lib/session.js';

function sendJson(response: any, statusCode: number, payload: unknown) {
  response.status(statusCode).json(payload);
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  const email = String(request.body?.email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    sendJson(response, 400, { message: 'Enter a valid email address.' });
    return;
  }

  const code = generateOneTimeCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await createAuthCode(email, hashValue(code), expiresAt);
  const result = await sendSignInCodeEmail(email, code);

  sendJson(response, 200, {
    ok: true,
    email,
    expiresAt: expiresAt.getTime(),
    devCode: result.devCode,
  });
}
