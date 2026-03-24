import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Archive, CheckCircle2, Crown, Files, LoaderCircle, LogIn, LogOut, Mail, RefreshCw, ShieldCheck, WandSparkles, X } from 'lucide-react';

import { consumeUsage, fetchAccountStatus, logoutAccount, requestMagicCode, verifyMagicCode } from '../lib/account';
import { FileCard } from '../components/FileCard';
import { FileDropZone } from '../components/FileDropZone';
import { MetadataViewerModal } from '../components/MetadataViewerModal';
import { cleanMetadata, readMetadata } from '../lib/exifUtils';
import {
  AUTO_CLEAR_MS,
  MAX_FREE_FILES,
  MAX_FREE_FILE_SIZE,
  detectFileKind,
  downloadBlob,
  isSupportedImage,
} from '../lib/fileTypes';
import { createPreviewAsset } from '../lib/heicHelper';
import { clearPlisioReturnState, createPlisioInvoice, getPlisioPlanLabel, getPlisioPriceLabel, isPlisioConfigured, readPlisioReturnState } from '../lib/plisio';
import { buildZipArchive } from '../lib/zipHelper';
import type { AccountStatus, ManagedFile, PremiumState, SelectiveRemovalKey, UsageState } from '../types/app';

function revokeManagedFile(file: ManagedFile) {
  URL.revokeObjectURL(file.previewUrl);

  if (file.cleaned) {
    URL.revokeObjectURL(file.cleaned.url);
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function Home() {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [premium, setPremium] = useState<PremiumState>({ active: false, expiresAt: null });
  const [usage, setUsage] = useState<UsageState>({
    date: '',
    limit: 5,
    used: 0,
    remaining: 5,
  });
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<{ status: 'success' | 'failed' | 'cancelled' | 'verifying'; orderNumber: string | null } | null>(null);
  const filesRef = useRef<ManagedFile[]>([]);
  const filesSectionRef = useRef<HTMLElement | null>(null);
  const previousFilesCountRef = useRef(0);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFiles((currentFiles) => {
        const now = Date.now();
        const expiredFiles = currentFiles.filter((file) => file.expiresAt <= now);

        if (expiredFiles.length === 0) {
          return currentFiles;
        }

        expiredFiles.forEach(revokeManagedFile);
        return currentFiles.filter((file) => file.expiresAt > now);
      });
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(
    () => () => {
      filesRef.current.forEach(revokeManagedFile);
    },
    [],
  );

  useEffect(() => {
    if (files.length > previousFilesCountRef.current && filesSectionRef.current) {
      window.setTimeout(() => {
        filesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }

    previousFilesCountRef.current = files.length;
  }, [files.length]);

  useEffect(() => {
    let active = true;

    async function hydrateStatus() {
      const returnState = readPlisioReturnState();
      const accountStatus = await refreshAccountStatus({ silent: true });

      if (!active || !returnState) {
        return;
      }

      if (returnState.status === 'success') {
        if (accountStatus?.premium.active) {
          setPaymentResult({
            status: 'success',
            orderNumber: returnState.orderNumber,
          });
          setNotice('Plisio payment confirmed. Premium unlocked.');
        } else {
          setPaymentResult({
            status: 'verifying',
            orderNumber: returnState.orderNumber,
          });

          window.setTimeout(async () => {
            const refreshedStatus = await refreshAccountStatus({ silent: true });

            if (!active) {
              return;
            }

            if (refreshedStatus?.premium.active) {
              setPaymentResult({
                status: 'success',
                orderNumber: returnState.orderNumber,
              });
              setNotice('Plisio payment confirmed. Premium unlocked.');
            }
          }, 2500);
        }
      }

      if (returnState.status === 'failed') {
        setPaymentResult({
          status: 'failed',
          orderNumber: returnState.orderNumber,
        });
        setNotice('Plisio payment was not completed.');
      }

      if (returnState.status === 'cancelled') {
        setPaymentResult({
          status: 'cancelled',
          orderNumber: returnState.orderNumber,
        });
        setNotice('Plisio checkout was cancelled.');
      }

      clearPlisioReturnState();
    }

    hydrateStatus();

    return () => {
      active = false;
    };
  }, []);

  const selectedFile = useMemo(() => files.find((file) => file.id === viewerId) ?? null, [files, viewerId]);

  const overview = useMemo(() => {
    const cleanedFiles = files.filter((file) => file.cleaned);
    const removedTags = cleanedFiles.reduce((sum, file) => sum + (file.cleaned?.removedCount ?? 0), 0);

    return {
      totalFiles: files.length,
      cleanedFiles: cleanedFiles.length,
      removedTags,
      dailyRemaining: premium.active ? null : usage.remaining,
    };
  }, [files, premium.active, usage.remaining]);

  const cleanedFiles = useMemo(() => files.filter((file) => file.cleaned), [files]);
  const checkoutEmail = authenticatedEmail || authEmail.trim().toLowerCase();

  async function refreshAccountStatus(options: { silent?: boolean } = {}): Promise<AccountStatus | null> {
    try {
      const accountStatus = await fetchAccountStatus();
      setPremium(accountStatus.premium);
      setUsage(accountStatus.usage);
      setAuthenticatedEmail(accountStatus.email);

      if (accountStatus.email) {
        setAuthEmail(accountStatus.email);
      }

      return accountStatus;
    } catch (error) {
      if (!options.silent) {
        setNotice(error instanceof Error ? error.message : 'Failed to load account status.');
      }

      return null;
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleAddFiles(selectedFiles: File[]) {
    const messages: string[] = [];
    const availableSlots = premium.active ? Number.POSITIVE_INFINITY : Math.max(0, MAX_FREE_FILES - files.length);
    const acceptedFiles: File[] = [];

    selectedFiles.forEach((file) => {
      if (!isSupportedImage(file)) {
        messages.push(`${file.name}: unsupported format.`);
        return;
      }

      if (file.size > MAX_FREE_FILE_SIZE && !premium.active) {
        messages.push(`${file.name}: free limit is 20 MB per file.`);
        return;
      }

      if (acceptedFiles.length >= availableSlots) {
        messages.push('Free plan accepts up to 5 files at the same time.');
        setShowPremiumPrompt(true);
        return;
      }

      acceptedFiles.push(file);
    });

    if (acceptedFiles.length === 0) {
      setNotice(messages[0] ?? 'No files were added.');
      return;
    }

    setNotice(messages.length > 0 ? messages.join(' ') : null);

    const loadedEntries = await Promise.all(
      acceptedFiles.map(async (file) => {
        const kind = detectFileKind(file);

        try {
          const preview = await createPreviewAsset(file, kind);
          const metadata = await readMetadata(file);

          return {
            id: crypto.randomUUID(),
            file,
            kind,
            previewUrl: URL.createObjectURL(preview.blob),
            previewNote: preview.note,
            metadata,
            cleaned: undefined,
            selectiveKeys: [],
            status: 'ready',
            error: undefined,
            expiresAt: Date.now() + AUTO_CLEAR_MS,
          } satisfies ManagedFile;
        } catch (error) {
          return {
            id: crypto.randomUUID(),
            file,
            kind,
            previewUrl: URL.createObjectURL(file),
            previewNote: undefined,
            metadata: undefined,
            cleaned: undefined,
            selectiveKeys: [],
            status: 'error',
            error: error instanceof Error ? error.message : 'File could not be processed.',
            expiresAt: Date.now() + AUTO_CLEAR_MS,
          } satisfies ManagedFile;
        }
      }),
    );

    setFiles((currentFiles) => [...loadedEntries, ...currentFiles]);
  }

  function updateFile(fileId: string, updater: (file: ManagedFile) => ManagedFile): void {
    setFiles((currentFiles) => currentFiles.map((file) => (file.id === fileId ? updater(file) : file)));
  }

  async function runFileCleanup(fileId: string, selectiveKeys: SelectiveRemovalKey[]) {
    const file = files.find((entry) => entry.id === fileId);

    if (!file || file.status === 'loading' || file.status === 'processing') {
      return false;
    }

    updateFile(fileId, (entry) => ({
      ...entry,
      status: 'processing',
      error: undefined,
      expiresAt: Date.now() + AUTO_CLEAR_MS,
    }));

    try {
      const result = await cleanMetadata(file.file, {
        selectiveKeys,
        preserveOriginalName: premium.active,
      });

      const nextUrl = URL.createObjectURL(result.blob);

      setFiles((currentFiles) =>
        currentFiles.map((entry) => {
          if (entry.id !== fileId) {
            return entry;
          }

          if (entry.cleaned) {
            URL.revokeObjectURL(entry.cleaned.url);
          }

          return {
            ...entry,
            status: 'ready',
            error: undefined,
            cleaned: {
              blob: result.blob,
              url: nextUrl,
              fileName: result.fileName,
              metadata: result.metadata,
              removedBytes: result.removedBytes,
              sizeDelta: result.sizeDelta,
              removedCount: result.removedCount,
              note: result.note,
              mode: selectiveKeys.length > 0 ? 'selective' : 'all',
            },
            expiresAt: Date.now() + AUTO_CLEAR_MS,
          };
        }),
      );

      return true;
    } catch (error) {
      updateFile(fileId, (entry) => ({
        ...entry,
        status: entry.metadata ? 'ready' : 'error',
        error: error instanceof Error ? error.message : 'Failed to clean metadata.',
      }));

      return false;
    }
  }

  async function registerUsage(count: number) {
    if (premium.active || count <= 0) {
      return true;
    }

    try {
      const result = await consumeUsage(count);
      setUsage(result.usage);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to update daily usage.');
      setShowPremiumPrompt(true);
      return false;
    }
  }

  function hasEnoughDailyQuota(requiredCount: number) {
    if (premium.active) {
      return true;
    }

    const remaining = usage.remaining ?? 0;

    if (remaining < requiredCount) {
      setNotice(`Free plan allows ${remaining} more cleaned file${remaining === 1 ? '' : 's'} today.`);
      setShowPremiumPrompt(true);
      return false;
    }

    return true;
  }

  async function processFile(fileId: string, selectiveKeys: SelectiveRemovalKey[]) {
    if (!hasEnoughDailyQuota(1)) {
      return;
    }

    const succeeded = await runFileCleanup(fileId, selectiveKeys);

    if (succeeded) {
      await registerUsage(1);
    }
  }

  async function handleBulkRemoveAll() {
    const eligibleFiles = files.filter((file) => file.status !== 'error');

    if (eligibleFiles.length === 0) {
      return;
    }

    if (!hasEnoughDailyQuota(eligibleFiles.length)) {
      return;
    }

    setBulkProcessing(true);

    try {
      let succeededCount = 0;

      for (const file of eligibleFiles) {
        const succeeded = await runFileCleanup(file.id, []);

        if (succeeded) {
          succeededCount += 1;
        }
      }

      if (succeededCount > 0) {
        await registerUsage(succeededCount);
      }
    } finally {
      setBulkProcessing(false);
    }
  }

  async function handleDownloadAll() {
    const readyFiles = files.filter((file) => file.cleaned).map((file) => ({ name: file.cleaned!.fileName, blob: file.cleaned!.blob }));

    if (readyFiles.length === 0) {
      setNotice('Run metadata cleanup first, then ZIP download becomes available.');
      return;
    }

    if (readyFiles.length === 1) {
      downloadBlob(readyFiles[0].blob, readyFiles[0].name);
      return;
    }

    const zip = await buildZipArchive(readyFiles);
    downloadBlob(zip, 'metaremover-cleaned-images.zip');
  }

  function handleDelete(fileId: string) {
    setFiles((currentFiles) => {
      const target = currentFiles.find((file) => file.id === fileId);

      if (target) {
        revokeManagedFile(target);
      }

      return currentFiles.filter((file) => file.id !== fileId);
    });

    if (viewerId === fileId) {
      setViewerId(null);
    }
  }

  function handleToggleSelectiveKey(fileId: string, key: SelectiveRemovalKey) {
    updateFile(fileId, (file) => ({
      ...file,
      selectiveKeys: file.selectiveKeys.includes(key)
        ? file.selectiveKeys.filter((item) => item !== key)
        : [...file.selectiveKeys, key],
    }));
  }

  function handlePremiumAttempt() {
    setShowPremiumPrompt(true);
  }

  async function handleSendCode() {
    if (!isValidEmail(authEmail.trim().toLowerCase())) {
      setNotice('Enter a valid email before requesting a sign-in code.');
      return;
    }

    setAuthLoading(true);

    try {
      const result = await requestMagicCode(authEmail.trim().toLowerCase());
      setCodeRequested(true);
      setDevCode(result.devCode || null);
      setNotice(`A sign-in code was sent to ${result.email}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to send sign-in code.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!isValidEmail(authEmail.trim().toLowerCase()) || !/^\d{6}$/.test(authCode.trim())) {
      setNotice('Enter a valid email and a 6-digit code.');
      return;
    }

    setAuthLoading(true);

    try {
      await verifyMagicCode(authEmail.trim().toLowerCase(), authCode.trim());
      setAuthCode('');
      setCodeRequested(false);
      setDevCode(null);
      await refreshAccountStatus({ silent: true });
      setNotice('Signed in successfully.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to verify code.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    setAuthLoading(true);

    try {
      await logoutAccount();
      setAuthenticatedEmail(null);
      setPremium({ active: false, expiresAt: null });
      await refreshAccountStatus({ silent: true });
      setNotice('Signed out.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to sign out.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handlePlisioCheckout() {
    if (premium.active) {
      setShowPremiumPrompt(false);
      return;
    }

    if (!isPlisioConfigured()) {
      setNotice('Plisio is not configured yet. Add VITE_PLISIO_CREATE_INVOICE_URL and run a backend invoice endpoint.');
      return;
    }

    if (!isValidEmail(checkoutEmail)) {
      setNotice('Enter a valid email before opening Plisio checkout.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const invoice = await createPlisioInvoice(checkoutEmail);

      if (invoice.txnId) {
        localStorage.setItem('metaremover-plisio-last-txn', invoice.txnId);
      }

      window.location.href = invoice.invoiceUrl;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to start Plisio checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <FileDropZone disabled={bulkProcessing} onFilesSelected={handleAddFiles} />

        <section className="rounded-[2rem] border border-blue-400/20 bg-blue-500/10 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.18em] text-blue-200">Account & limits</div>
              <h2 className="text-2xl font-semibold text-white">
                {authenticatedEmail ? `Signed in as ${authenticatedEmail}` : 'Sign in with email code to restore premium'}
              </h2>
              <p className="text-sm leading-6 text-slate-200">
                {premium.active
                  ? 'Premium is active and stored on the backend.'
                  : `Free plan: ${usage.remaining ?? 0} of ${usage.limit ?? 5} cleaned files left today.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {!authenticatedEmail ? (
                <>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="min-w-[240px] rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={authLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    Send code
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={authLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              )}
            </div>
          </div>

          {!authenticatedEmail && codeRequested && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                inputMode="numeric"
                value={authCode}
                onChange={(event) => setAuthCode(event.target.value)}
                placeholder="Enter 6-digit code"
                className="min-w-[220px] rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={authLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                Verify code
              </button>
              {devCode && (
                <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Dev code: {devCode}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-slate-400">
              <Files className="h-5 w-5 text-blue-300" />
              Files loaded
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{overview.totalFiles}</div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-slate-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              Cleaned files
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{overview.cleanedFiles}</div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-slate-400">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
              Tags removed
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{overview.removedTags}</div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-slate-400">
              <Archive className="h-5 w-5 text-violet-300" />
              {premium.active ? 'Daily limit' : 'Free files left'}
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{premium.active ? 'Unlimited' : overview.dailyRemaining}</div>
          </div>
        </section>

        {paymentResult && (
          <section
            className={[
              'rounded-[2rem] border p-6',
              paymentResult.status === 'success'
                ? 'border-emerald-400/20 bg-emerald-500/10'
                : paymentResult.status === 'verifying'
                  ? 'border-blue-400/20 bg-blue-500/10'
                  : 'border-amber-400/20 bg-amber-400/10',
            ].join(' ')}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  {paymentResult.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  ) : paymentResult.status === 'verifying' ? (
                    <LoaderCircle className="h-5 w-5 animate-spin text-blue-300" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-300" />
                  )}
                  {paymentResult.status === 'success'
                    ? 'Payment confirmed'
                    : paymentResult.status === 'verifying'
                      ? 'Verifying payment'
                      : paymentResult.status === 'failed'
                        ? 'Payment failed'
                        : 'Checkout cancelled'}
                </div>
                <p className="text-sm leading-6 text-slate-200">
                  {paymentResult.status === 'success' && 'Premium is active for your account. Unlimited batch and selective removal are unlocked.'}
                  {paymentResult.status === 'verifying' && 'Plisio returned successfully, but the webhook may still be processing. Refresh your account status in a few seconds.'}
                  {paymentResult.status === 'failed' && 'Payment was not completed. You can try again from the premium prompt.'}
                  {paymentResult.status === 'cancelled' && 'Checkout was cancelled before payment confirmation.'}
                </p>
                {paymentResult.orderNumber && <div className="text-xs text-slate-300">Order: {paymentResult.orderNumber}</div>}
              </div>

              <button
                type="button"
                onClick={() => refreshAccountStatus()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh status
              </button>
            </div>
          </section>
        )}

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Account & limits</div>
              <h2 className="text-2xl font-semibold text-white">
                {authenticatedEmail ? authenticatedEmail : 'Sign in to restore premium on any device'}
              </h2>
              <p className="text-sm leading-6 text-slate-400">
                {statusLoading
                  ? 'Loading account status...'
                  : premium.active
                    ? 'Premium is stored on the backend and tied to your email account.'
                    : `Free plan: ${usage.remaining ?? 0} of ${usage.limit ?? 5} cleaned files left today.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {authenticatedEmail ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={authLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : (
                <>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="Enter email for premium access"
                    className="min-w-[260px] rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={authLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    Send code
                  </button>
                </>
              )}
            </div>
          </div>

          {!authenticatedEmail && codeRequested && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                inputMode="numeric"
                value={authCode}
                onChange={(event) => setAuthCode(event.target.value)}
                placeholder="Enter 6-digit code"
                className="min-w-[220px] rounded-full border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={authLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                Verify code
              </button>
              {devCode && (
                <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Dev code: {devCode}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Bulk actions</div>
            <h2 className="text-2xl font-semibold text-white">Remove everything locally, then export cleaned copies.</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Orientation is preserved for JPEG, ICC profiles are kept when possible and free users can clean up to 5 files per day.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={handleBulkRemoveAll}
              disabled={files.length === 0 || bulkProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <WandSparkles className="h-4 w-4" />
              {bulkProcessing ? 'Processing...' : 'Remove All Metadata'}
            </button>
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={files.every((file) => !file.cleaned)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              {cleanedFiles.length <= 1 ? 'Download File' : 'Download ZIP'}
            </button>
          </div>
        </section>

        {notice && (
          <div className="rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
            {notice}
          </div>
        )}

        {files.length > 0 ? (
          <section ref={filesSectionRef} className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                premiumActive={premium.active}
                onOpenViewer={() => setViewerId(file.id)}
                onRemoveAll={() => processFile(file.id, [])}
                onSelectiveRemove={() => processFile(file.id, file.selectiveKeys)}
                onToggleSelectiveKey={(key) => handleToggleSelectiveKey(file.id, key)}
                onDownload={() => file.cleaned && downloadBlob(file.cleaned.blob, file.cleaned.fileName)}
                onDelete={() => handleDelete(file.id)}
                onPremiumAttempt={handlePremiumAttempt}
              />
            ))}
          </section>
        ) : (
          <section className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-8 py-14 text-center">
            <h2 className="text-2xl font-semibold text-white">Drop your first image to inspect metadata.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Test with iPhone GPS photos, Canon or Nikon JPEGs, HEIC from iOS and PNG files without EXIF to verify
              orientation retention and file size reduction after cleanup.
            </p>
          </section>
        )}
      </div>

      {showPremiumPrompt && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100%-2rem)] max-w-md rounded-[1.75rem] border border-emerald-400/20 bg-slate-900/95 p-5 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">
                <Crown className="h-4 w-4" />
                Premium feature
              </div>
              <h3 className="text-lg font-semibold text-white">Selective removal and unlimited batch are premium.</h3>
              <p className="text-sm leading-6 text-slate-300">
                Premium is stored on the backend and linked to your email. Free users can clean up to 5 files per day.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPremiumPrompt(false)}
              className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Premium email</div>
              <input
                type="email"
                value={checkoutEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <div className="text-xs text-slate-400">
              {authenticatedEmail
                ? `Signed in as ${authenticatedEmail}`
                : 'This email will be used to restore premium on another device. You can also sign in from the account block above.'}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {premium.active ? (
              <button
                type="button"
                onClick={() => setShowPremiumPrompt(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
              >
                Premium is active
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePlisioCheckout}
                  disabled={checkoutLoading || !isPlisioConfigured() || !isValidEmail(checkoutEmail)}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkoutLoading ? 'Opening Plisio...' : `Pay with Plisio - $${getPlisioPriceLabel()}`}
                </button>
                {!isPlisioConfigured() && (
                  <div className="w-full rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    Add `VITE_PLISIO_CREATE_INVOICE_URL` to enable checkout.
                  </div>
                )}
              </>
            )}
          </div>
          <div className="mt-3 text-xs text-slate-400">{getPlisioPlanLabel()}</div>
        </div>
      )}

      <MetadataViewerModal file={selectedFile} onClose={() => setViewerId(null)} />
    </main>
  );
}
