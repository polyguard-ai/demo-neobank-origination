'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageWithDocs } from '@/components/PageWithDocs';
import { useAppStore } from '@/lib/state';

export default function ApplyPage() {
  const router = useRouter();
  const setApplicant = useAppStore((s) => s.setApplicant);
  const applicant = useAppStore((s) => s.applicant);
  const [submitting, setSubmitting] = useState(false);

  return (
    <PageWithDocs slug="apply">
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal">Tell us about you</h1>
        <p className="text-charcoal-soft mt-2 max-w-prose">
          We need a few details before we verify your identity. We&apos;ll only ask
          once.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            const f = new FormData(e.currentTarget);
            setApplicant({
              firstName: String(f.get('firstName') || ''),
              lastName: String(f.get('lastName') || ''),
              dob: String(f.get('dob') || ''),
              email: String(f.get('email') || ''),
              ssnLast4: String(f.get('ssnLast4') || ''),
            });
            router.push('/verify');
          }}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="field-label">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                autoComplete="given-name"
                defaultValue={applicant.firstName ?? ''}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="field-label">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                autoComplete="family-name"
                defaultValue={applicant.lastName ?? ''}
                className="field-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              defaultValue={applicant.email ?? ''}
              className="field-input"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dob" className="field-label">
                Date of birth
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                required
                autoComplete="bday"
                defaultValue={applicant.dob ?? ''}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="ssnLast4" className="field-label">
                Last 4 of SSN
              </label>
              <input
                id="ssnLast4"
                name="ssnLast4"
                required
                pattern="\d{4}"
                maxLength={4}
                inputMode="numeric"
                placeholder="••••"
                defaultValue={applicant.ssnLast4 ?? ''}
                className="field-input"
              />
            </div>
          </div>

          <p className="text-xs text-charcoal-soft">
            Demo only — no real KYC is performed and no data is stored
            server-side. Form contents live in your browser&apos;s local storage
            until you reset.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full sm:w-auto"
            data-tap
          >
            Continue to verification
          </button>
        </form>
      </section>
    </PageWithDocs>
  );
}
