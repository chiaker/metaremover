import { deleteAuthSession } from '../_lib/repository.js';
import { destroyUserSession } from '../_lib/session.js';
import { getSessionToken } from '../_lib/cookies.js';
import { hashValue } from '../_lib/security.js';

function sendJson(response: any, statusCode: number, payload: unknown) {
  response.status(statusCode).json(payload);
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { message: 'Method not allowed.' });
    return;
  }

  const token = getSessionToken(request);

  if (token) {
    await deleteAuthSession(hashValue(token));
  }

  destroyUserSession(response);

  sendJson(response, 200, {
    ok: true,
  });
}
