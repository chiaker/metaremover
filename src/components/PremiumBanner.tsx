import { Crown, Sparkles } from 'lucide-react';

import { formatExpiry } from '../lib/fileTypes';
import type { PremiumState } from '../types/app';

type PremiumBannerProps = {
  premium: PremiumState;
  onActivate: () => void;
  onDisable: () => void;
};

export function PremiumBanner({ premium, onActivate, onDisable }: PremiumBannerProps) {
  return (
    <section className="rounded-3xl border border-teal-200/90 bg-teal-50/40 p-6 shadow-sm dark:border-teal-800/35 dark:bg-teal-950/25">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/90 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-teal-800 dark:border-teal-800/40 dark:bg-teal-950/40 dark:text-teal-200">
            <Crown className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Premium
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-800 dark:text-stone-100">Unlock selective removal and unlimited batch.</h2>
          <p className="max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-400">
            Premium unlocks selective metadata removal, higher batch limits, original filenames on download, and fewer
            upgrade prompts. Your subscription is tied to your account after checkout.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-2xl border border-stone-200/90 bg-white/80 px-4 py-3 text-sm text-stone-700 dark:border-stone-600/50 dark:bg-stone-800/60 dark:text-stone-300">
            {premium.active && premium.expiresAt ? `Premium active for ~${formatExpiry(premium.expiresAt)}` : 'See checkout for current pricing'}
          </div>
          {premium.active ? (
            <button
              type="button"
              onClick={onDisable}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800/60 dark:text-stone-100 dark:hover:bg-stone-700/70"
            >
              Disable premium demo
            </button>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-200 px-5 py-3 text-sm font-semibold text-teal-950 transition hover:bg-teal-300 dark:bg-teal-700/40 dark:text-teal-50 dark:hover:bg-teal-700/55"
            >
              <Sparkles className="h-4 w-4" />
              Unlock demo premium
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
