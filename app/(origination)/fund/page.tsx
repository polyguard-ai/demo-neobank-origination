'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageWithDocs } from '@/components/PageWithDocs';
import { useAppStore, useHasHydrated } from '@/lib/state';
import { TrustCheckBadge } from '@/components/TrustCheckBadge';
import {
  runPolyguardVerify,
  PolyguardCancelled,
} from '@/lib/run-polyguard-verify';

type Step = 'amount' | 'awaiting-webhook' | 'done';

export default function FundPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const verification = useAppStore((s) => s.verification);
  const setVerification = useAppStore((s) => s.setVerification);
  const account = useAppStore((s) => s.account);
  const setAccount = useAppStore((s) => s.setAccount);

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('500');
  const [sdkRunning, setSdkRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The link_uuid produced by the *reverify* SDK call. We only advance to
  // 'done' when the webhook for THIS link_uuid arrives — never when the
  // original KYC bundle's event is still in the store.
  const reverifyLinkUuid = useRef<string | null>(null);

  useEffect(() => {
    if (hasHydrated && !verification) router.replace('/verify');
  }, [hasHydrated, verification, router]);

  // Watch for the webhook receipt for the reverify trust check.
  useEffect(() => {
    if (step !== 'awaiting-webhook') return;
    if (!reverifyLinkUuid.current) return;
    if (verification?.linkUuid !== reverifyLinkUuid.current) return;
    if (verification.event === 'trust_check.completed') {
      setStep('done');
    } else if (verification.event === 'trust_check.failed') {
      setError(verification.reason ?? 'Re-verification failed');
      setStep('amount');
      reverifyLinkUuid.current = null;
    }
  }, [step, verification?.linkUuid, verification?.event, verification?.reason]);

  // Once the webhook lands and we're 'done', POST /api/account.
  useEffect(() => {
    async function ensureAccount() {
      if (step !== 'done' || account || !verification) return;
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ linkUuid: verification.linkUuid }),
      });
      if (res.ok) setAccount(await res.json());
    }
    ensureAccount();
  }, [step, account, verification, setAccount]);

  if (!hasHydrated || !verification) return null;

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSdkRunning(true);
    try {
      // No target → SDK appends its own full-screen modal to document.body.
      // The SDK's modal owns its UI (QR/button, cancel/close, error toast).
      // verify() resolves only after the user completes on device, or
      // rejects with 'User cancelled' if they close the modal.
      const snapshot = await runPolyguardVerify({ mode: 'reverify' });
      reverifyLinkUuid.current = snapshot.linkUuid;
      // Stash the SDK snapshot — WebhookEnrichment picks it up and polls
      // /api/status/{linkUuid} until the webhook lands.
      setVerification(snapshot);
      setStep('awaiting-webhook');
    } catch (err) {
      if (err instanceof PolyguardCancelled) {
        // User clicked the SDK modal's close/cancel — silent return.
        return;
      }
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSdkRunning(false);
    }
  }

  return (
    <PageWithDocs slug="fund">
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal">
          Fund your account
        </h1>
        <p className="text-charcoal-soft mt-2 max-w-prose">
          Before we move money for the first time, Polyguard re-confirms that the
          person authorizing the transfer is the same person who opened the
          account. This is continuous verification at work.
        </p>

        {step === 'amount' && (
          <form className="mt-8 card space-y-4" onSubmit={handleFund}>
            <div>
              <label htmlFor="amount" className="field-label">
                Initial deposit
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-serif">$</span>
                <input
                  id="amount"
                  name="amount"
                  inputMode="decimal"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="field-input text-2xl font-serif"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={sdkRunning}
              className="btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-progress"
              data-tap
            >
              {sdkRunning ? 'Opening Trust Check…' : `Fund $${amount || '0'}`}
            </button>
            <p className="text-xs text-charcoal-soft">
              Polyguard opens its own re-verification modal. Funds only move
              once the signed webhook receipt arrives.
            </p>
            {error && (
              <div className="flex items-start gap-2 text-error text-xs">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        )}

        {step === 'awaiting-webhook' && (
          <div className="mt-8 card flex flex-col items-center text-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-sage-strong" />
            <p className="font-medium text-charcoal">
              Confirming with Polyguard…
            </p>
            <p className="text-xs text-charcoal-soft max-w-xs">
              Trust Check signed on device. Waiting for the AES-256-GCM webhook
              receipt before we move ${amount || '0'}.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs text-charcoal-soft mt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-sage-strong" />
              SDK resolved · webhook pending
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-8 card">
            <TrustCheckBadge label="Re-verified · Funds moved" />
            <h2 className="font-serif text-2xl mt-3">Welcome to Beige Bank.</h2>
            {account ? (
              <dl className="mt-5 space-y-3 text-sm">
                <Pair label="Account number" value={account.accountNumber} />
                <Pair label="Routing" value={account.routing} />
                <Pair label="Initial deposit" value={`$${amount}`} />
              </dl>
            ) : (
              <p className="text-sm text-charcoal-soft mt-3">Creating your account…</p>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/admin/affidavit/${verification.linkUuid}`}
                className="btn-sage w-full sm:w-auto"
                data-tap
              >
                See the signed Transaction Affidavit
              </Link>
              <Link href="/compare" className="btn-secondary w-full sm:w-auto" data-tap>
                How is this different from legacy KYC?
              </Link>
            </div>
          </div>
        )}
      </section>
    </PageWithDocs>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-charcoal/10 pb-2 last:border-0 last:pb-0">
      <dt className="text-charcoal-soft">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
