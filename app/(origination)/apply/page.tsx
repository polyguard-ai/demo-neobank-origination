'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageWithDocs } from '@/components/PageWithDocs';
import { TrustCheckBadge } from '@/components/TrustCheckBadge';
import { useAppStore, useHasHydrated } from '@/lib/state';
import { CheckCircle2 } from 'lucide-react';

function splitFullName(full: string | undefined): { firstName: string; lastName: string } {
  if (!full) return { firstName: '', lastName: '' };
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export default function ApplyPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const verification = useAppStore((s) => s.verification);
  const setApplicant = useAppStore((s) => s.setApplicant);
  const applicant = useAppStore((s) => s.applicant);

  const [email, setEmail] = useState(applicant.email ?? '');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasHydrated && !verification) router.replace('/verify');
  }, [hasHydrated, verification, router]);

  if (!hasHydrated || !verification) return null;

  const v = (verification.verification ?? {}) as Record<string, unknown>;
  const fullName = (v.full_name as string | undefined) ?? '';
  const { firstName, lastName } = splitFullName(fullName);
  const region = (v.region as string | undefined) ?? '';
  const documentType = (v.document_type as string | undefined) ?? '';
  const issuingCountry = (v.issuing_country as string | undefined) ?? '';

  return (
    <PageWithDocs slug="apply">
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal">
          Confirm your details
        </h1>
        <p className="text-charcoal-soft mt-2 max-w-prose">
          Polyguard already verified your government ID, so we don&apos;t need to
          ask for most of this. Just confirm what we know and tell us where to
          send your statements.
        </p>

        <div className="card mt-8">
          <div className="flex items-center justify-between">
            <TrustCheckBadge label="Verified by Polyguard" />
            <span className="text-[0.7rem] uppercase tracking-wider text-charcoal-soft">
              From your Trust Check
            </span>
          </div>
          <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <VerifiedField label="First name" value={firstName || '—'} />
            <VerifiedField label="Last name" value={lastName || '—'} />
            <VerifiedField label="Document" value={documentType || '—'} />
            <VerifiedField label="Issuing country" value={issuingCountry || '—'} />
            <VerifiedField label="Region" value={region || '—'} />
          </dl>
          <p className="mt-4 text-xs text-charcoal-soft">
            None of this is editable — it&apos;s read from the cryptographic
            verification, not from form input.
          </p>
        </div>

        <form
          className="mt-6 card space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            setApplicant({
              firstName,
              lastName,
              email,
              dob: '',
              ssnLast4: '',
            });
            router.push('/fund');
          }}
        >
          <div>
            <label htmlFor="email" className="field-label">
              Email for statements
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field-input"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-charcoal-soft">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              className="mt-1 h-4 w-4 accent-sage-strong"
            />
            <span>
              I agree to the deposit account agreement, electronic-disclosure
              consent, and Beige Bank&apos;s privacy notice.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !agreed || !email}
            className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            data-tap
          >
            Open my account
          </button>
        </form>
      </section>
    </PageWithDocs>
  );
}

function VerifiedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-wider text-charcoal-soft">
        {label}
      </dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-charcoal font-medium">
        <CheckCircle2 className="h-3.5 w-3.5 text-sage-strong shrink-0" />
        <span className="truncate">{value}</span>
      </dd>
    </div>
  );
}
