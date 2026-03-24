import { parse, serialize } from 'cookie';

const SESSION_COOKIE_NAME = 'metaremover_session';
const ANON_COOKIE_NAME = 'metaremover_anon';

function appendSetCookie(response: any, value: string) {
  const current = response.getHeader('Set-Cookie');

  if (!current) {
    response.setHeader('Set-Cookie', value);
    return;
  }

  if (Array.isArray(current)) {
    response.setHeader('Set-Cookie', [...current, value]);
    return;
  }

  response.setHeader('Set-Cookie', [String(current), value]);
}

export function readCookies(request: any) {
  return parse(request.headers.cookie || '');
}

export function getSessionToken(request: any) {
  return readCookies(request)[SESSION_COOKIE_NAME] || '';
}

export function getAnonSubject(request: any) {
  return readCookies(request)[ANON_COOKIE_NAME] || '';
}

export function setSessionCookie(response: any, token: string, expiresAt: Date) {
  appendSetCookie(
    response,
    serialize(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    }),
  );
}

export function clearSessionCookie(response: any) {
  appendSetCookie(
    response,
    serialize(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    }),
  );
}

export function setAnonCookie(response: any, token: string, expiresAt: Date) {
  appendSetCookie(
    response,
    serialize(ANON_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    }),
  );
}
