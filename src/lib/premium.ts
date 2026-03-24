import type { PremiumState } from '../types/app';

const PREMIUM_STORAGE_KEY = 'metaremover-premium';

export function loadPremiumState(): PremiumState {
  try {
    const raw = localStorage.getItem(PREMIUM_STORAGE_KEY);

    if (!raw) {
      return { active: false, expiresAt: null };
    }

    const parsed = JSON.parse(raw) as PremiumState;
    const isActive = Boolean(parsed.expiresAt && parsed.expiresAt > Date.now());

    return {
      active: isActive,
      expiresAt: isActive ? parsed.expiresAt : null,
    };
  } catch {
    return { active: false, expiresAt: null };
  }
}

export function savePremiumState(state: PremiumState): void {
  localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(state));
}

export function activatePremium(days = 30): PremiumState {
  const nextState: PremiumState = {
    active: true,
    expiresAt: Date.now() + days * 24 * 60 * 60 * 1000,
  };

  savePremiumState(nextState);
  return nextState;
}

export function activatePremiumUntil(expiresAt: number | null): PremiumState {
  const nextState: PremiumState = {
    active: Boolean(expiresAt && expiresAt > Date.now()),
    expiresAt: expiresAt && expiresAt > Date.now() ? expiresAt : null,
  };

  savePremiumState(nextState);
  return nextState;
}

export function clearPremiumState(): PremiumState {
  const nextState: PremiumState = {
    active: false,
    expiresAt: null,
  };

  savePremiumState(nextState);
  return nextState;
}
