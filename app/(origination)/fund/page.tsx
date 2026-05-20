'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageWithDocs } from '@/components/PageWithDocs';
import { PolyguardVerify } from '@/components/PolyguardVerify';
import { useAppStore } from '@/lib/state';
import { TrustCheckBadge } from '@/components/TrustCheckBadge';

export default function FundPage() {
  const router = useRouter();
  const verification = useAppStore((s) => s.verification);
  const account = useAppStore((s) => s.account);
  const setAccount = useAppStore((s) => s.setAccount);
  const [step, setStep] = useState<'amount' | 'reverify' | 'done'>('amount');
  const [amount, setAmount] = useState('500');

  useEffect(() => {
    if (!verification) router.replace('/verify');
  }, [verification, router]);

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

  if (!verification) return null;

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
          <form
            className="mt-8 card space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setStep('reverify');
            }}
          >
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
            <button type="submit" className="btn-primary w-full sm:w-auto" data-tap>
              Fund ${amount || '0'}
            </button>
          </form>
        )}

        {step === 'reverify' && (
          <div className="mt-8 space-y-4">
            <p className="text-sm font-medium">
              Re-verifying your identity before moving funds…
            </p>
            <PolyguardVerify
              mode="reverify"
              onComplete={() => setStep('done')}
            />
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
