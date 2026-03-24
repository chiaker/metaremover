import { clearSessionCookie, getAnonSubject, getSessionToken, setAnonCookie, setSessionCookie } from './cookies.js';
import { getPremiumStatus, getSessionByTokenHash } from './repository.js';
import { generateToken, hashValue } from './security.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ANON_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const FREE_DAILY_LIMIT = 5;

export function getFreeDailyLimit() {
  return FREE_DAILY_LIMIT;
}

export function getTodayUsageKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createUserSession(response: any, userId: number) {
  const rawToken = generateToken();
  const tokenHash = hashValue(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  setSessionCookie(response, rawToken, expiresAt);

  return {
    tokenHash,
    expiresAt,
    userId,
  };
}

export function destroyUserSession(response: any) {
  clearSessionCookie(response);
}

export async function resolveSession(request: any) {
  const token = getSessionToken(request);

  if (!token) {
    return {
      authenticated: false,
      email: null,
      userId: null,
      premium: {
        active: false,
        expiresAt: null,
      },
    };
  }

  const session = await getSessionByTokenHash(hashValue(token));

  if (!session) {
    return {
      authenticated: false,
      email: null,
      userId: null,
      premium: {
        active: false,
        expiresAt: null,
      },
    };
  }

  const premium = await getPremiumStatus(session.userId);

  return {
    authenticated: true,
    email: session.email,
    userId: session.userId,
    premium,
  };
}

export function ensureAnonymousSubject(request: any, response: any) {
  const existing = getAnonSubject(request);

  if (existing) {
    return existing;
  }

  const rawToken = generateToken();
  setAnonCookie(response, rawToken, new Date(Date.now() + ANON_TTL_MS));
  return rawToken;
}

export async function resolveUsageSubject(request: any, response: any) {
  const session = await resolveSession(request);

  if (session.authenticated && session.email) {
    return {
      ...session,
      subjectKey: `user:${session.email.toLowerCase()}`,
    };
  }

  const anonSubject = ensureAnonymousSubject(request, response);

  return {
    ...session,
    subjectKey: `anon:${anonSubject}`,
  };
}
