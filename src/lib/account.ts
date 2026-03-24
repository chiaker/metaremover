import type { AccountStatus } from '../types/app';

type AuthCodeResponse = {
  ok: true;
  email: string;
  expiresAt: number;
  devCode?: string | null;
};

async function readJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'same-origin',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = await readJson<{ message?: string } & T>(response);

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed.');
  }

  return data as T;
}

export function fetchAccountStatus() {
  return request<AccountStatus>('/api/premium/status', {
    method: 'GET',
    headers: {},
  });
}

export function requestMagicCode(email: string) {
  return request<AuthCodeResponse>('/api/auth/request-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyMagicCode(email: string, code: string) {
  return request<{ ok: true; email: string; premium: AccountStatus['premium'] }>('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function logoutAccount() {
  return request<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function consumeUsage(count: number) {
  return request<{ ok: true; premium: boolean; usage: AccountStatus['usage'] }>('/api/usage/consume', {
    method: 'POST',
    body: JSON.stringify({ count }),
  });
}
