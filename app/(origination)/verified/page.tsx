'use client';
import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageWithDocs } from '@/components/PageWithDocs';
import { TrustCheckBadge } from '@/components/TrustCheckBadge';
import { useAppStore, useHasHydrated } from '@/lib/state';
import { CheckCircle2 } from 'lucide-react';

export default function VerifiedPage() {
  // useSearchParams must be inside a Suspense boundary for Next.js prerender.
  return (
    <Suspense fallback={null}>
      <VerifiedPageInner />
    </Suspense>
  );
}

function VerifiedPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasHydrated = useHasHydrated();
  const verification = useAppStore((s) => s.verification);
  const setVerification = useAppStore((s) => s.setVerification);

  // /verified is reached two ways:
  //   - Same-tab navigation after the desktop QR-scan flow (verification
  //     already in the store).
  //   - New tab opened by Polyguard Mobile after the one-device redirect
  //     flow, with ``?link_uuid=…`` in the URL but no store state.
  //
  // For the second case, bootstrap a minimal SDK-source snapshot so the
  // layout-level WebhookEnrichment picks it up and starts polling
  // /api/status/{linkUuid}. The webhook then fills in verification +
  // affidavit fields. If neither path applies (no store, no link_uuid),
  // bounce back to /verify.
  useEffect(() => {
    if (!hasHydrated) return;
    if (verification) return;
    const linkUuidFromUrl = searchParams.get('link_uuid');
    if (linkUuidFromUrl) {
      setVerification({
        linkUuid: linkUuidFromUrl,
        source: 'sdk',
        status: 'success',
        reason: null,
      });
      return;
    }
    router.replace('/verify');
  }, [hasHydrated, verification, searchParams, setVerification, router]);

  if (!hasHydrated) return null;

  if (!verification) {
    return (
      <PageWithDocs slug="verified">
        <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-charcoal-soft">
            No verification on file yet — sending you back to verify your identity…
          </p>
        </section>
      </PageWithDocs>
    );
  }

  const v = (verification.verification ?? {}) as Record<string, unknown>;
  // Presence may live either on the bundle (from SDK) or inside verification (from webhook).
  const presence =
    verification.presence ??
    (v.presence as { score?: string | number } | undefined);
  const certainty = v.certainty as number | undefined;
  const awaitingWebhook =
    verification.source === 'sdk' && !verification.affidavitUrl;

  return (
    <PageWithDocs slug="verified">
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <TrustCheckBadge label="Trust Check completed" />
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal mt-4">
          You&apos;re verified.
        </h1>
        <p className="text-charcoal-soft mt-2 max-w-prose">
          Polyguard signed off on your identity. Here&apos;s what we received from
          the webhook — your biometrics never left your phone.
        </p>

        <div className="card mt-8 space-y-4">
          <Row
            label="Status"
            value={
              <span className="inline-flex items-center gap-1.5 text-sage-strong font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {verification.event === 'trust_check.completed' ? 'Completed' : verification.event}
              </span>
            }
          />
          {certainty !== undefined && (
            <Row
              label="Biometric certainty"
              value={<span className="font-mono">{formatCertainty(certainty)}</span>}
            />
          )}
          {presence?.score !== undefined && presence.score !== '' && (
            <Row
              label="PG-Presence"
              value={<span className="font-mono">{String(presence.score)}</span>}
            />
          )}
          {v.document_type ? (
            <Row label="Document" value={String(v.document_type)} />
          ) : null}
          {v.issuing_country ? (
            <Row label="Issuing country" value={String(v.issuing_country)} />
          ) : null}
          {v.region ? <Row label="Region" value={String(v.region)} /> : null}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/apply" className="btn-primary w-full sm:w-auto" data-tap>
            Continue
          </Link>
          <Link
            href={`/admin/affidavit/${verification.linkUuid}`}
            className="btn-secondary w-full sm:w-auto"
            data-tap
          >
            View Transaction Affidavit
          </Link>
        </div>
        {awaitingWebhook && (
          <p className="mt-3 text-xs text-charcoal-soft">
            The Transaction Affidavit becomes available once the Polyguard
            webhook arrives (usually within a second or two).
          </p>
        )}
      </section>
    </PageWithDocs>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 border-b border-charcoal/10 pb-3 last:border-0 last:pb-0">
      <dt className="text-xs uppercase tracking-wider text-charcoal-soft">{label}</dt>
      <dd className="text-sm text-charcoal">{value}</dd>
    </div>
  );
}

function formatCertainty(c: number): string {
  if (c <= 1) return (c * 100).toFixed(2) + '%';
  return c.toFixed(2) + '%';
}
