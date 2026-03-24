import { createUserSession, isValidEmail } from '../_lib/session.js';
import { consumeAuthCode, createAuthSession, getLatestActiveAuthCode, getOrCreateUserByEmail, getPremiumStatus } from '../_lib/repository.js';
import { hashValue, safeEqual } from '../_lib/security.js';

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
  const code = String(request.body?.code || '').trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    sendJson(response, 400, { message: 'Invalid email or code.' });
    return;
  }

  const authCode = await getLatestActiveAuthCode(email);

  if (!authCode || !safeEqual(authCode.codeHash, hashValue(code))) {
    sendJson(response, 401, { message: 'Code is invalid or expired.' });
    return;
  }

  await consumeAuthCode(authCode.id);
  const user = await getOrCreateUserByEmail(email);

  if (!user) {
    sendJson(response, 500, { message: 'Database is not configured for sign-in.' });
    return;
  }

  const session = await createUserSession(response, user.id);
  await createAuthSession(user.id, session.tokenHash, session.expiresAt);
  const premium = await getPremiumStatus(user.id);

  sendJson(response, 200, {
    ok: true,
    email,
    premium,
  });
}
