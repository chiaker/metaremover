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
    <section className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-6 shadow-lg shadow-emerald-950/10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">
            <Crown className="h-4 w-4" />
            Premium
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Unlock selective removal and unlimited batch.</h2>
          <p className="max-w-3xl text-sm leading-6 text-emerald-50/85">
            Premium unlocks selective metadata removal, higher batch limits, original filenames on download, and fewer
            upgrade prompts. Your subscription is tied to your account after checkout.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            {premium.active && premium.expiresAt ? `Premium active for ~${formatExpiry(premium.expiresAt)}` : 'See checkout for current pricing'}
          </div>
          {premium.active ? (
            <button
              type="button"
              onClick={onDisable}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Disable premium demo
            </button>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
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
