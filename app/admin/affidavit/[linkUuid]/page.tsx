import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { PageWithDocs } from '@/components/PageWithDocs';
import { AffidavitButton } from '@/components/AffidavitButton';
import { TrustCheckBadge } from '@/components/TrustCheckBadge';
import { getPayload } from '@/lib/webhook-store';
import { getAllowlist } from '@/lib/affidavit-url';

export const dynamic = 'force-dynamic';

export default async function AffidavitPage({
  params,
}: {
  params: Promise<{ linkUuid: string }>;
}) {
  const { linkUuid } = await params;
  const payload = await getPayload(linkUuid);
  const allowlist = getAllowlist();

  return (
    <Shell>
      <PageWithDocs slug="affidavit">
        <section className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-[0.7rem] uppercase tracking-wider text-charcoal-soft">
            Beige Bank · Compliance console
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-charcoal mt-2">
            Transaction Affidavit
          </h1>

          {!payload ? (
            <div className="mt-6 card">
              <p className="text-charcoal-soft">
                No webhook on file for <code className="font-mono">{linkUuid}</code> yet.
                If this is a cold-started Vercel function the in-memory store has
                been cleared — re-run the verification to see the affidavit.
              </p>
              <Link href="/verify" className="btn-secondary mt-4 inline-flex" data-tap>
                Run a Trust Check
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="card">
                <TrustCheckBadge
                  label={
                    payload.event === 'trust_check.completed'
                      ? 'Verified · admissible record'
                      : 'Trust Check failed'
                  }
                />
                <p className="mt-3 text-sm text-charcoal-soft">
                  This affidavit is certified under NY CPLR § 3122-a as a business
                  record of the verification event. The presigned URL below opens
                  the signed PDF.
                </p>
                <div className="mt-4">
                  <AffidavitButton
                    href={payload.data?.affidavit_url}
                    allowlist={allowlist}
                  />
                </div>
              </div>

              <div className="card">
                <h2 className="font-serif text-xl">Verification details</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <DetailRow label="Event" value={payload.event} />
                  <DetailRow label="Link UUID" value={payload.link_uuid} mono />
                  <DetailRow
                    label="Timestamp"
                    value={new Date(payload.timestamp * 1000).toISOString()}
                    mono
                  />
                  {payload.data?.verification &&
                    Object.entries(payload.data.verification)
                      .filter(
                        ([k, v]) =>
                          !['photo_verification_url'].includes(k) && hasValue(v),
                      )
                      .map(([k, v]) => (
                        <DetailRow
                          key={k}
                          label={prettyKey(k)}
                          value={formatValue(v)}
                          mono={typeof v === 'string' && /[-_]/.test(v)}
                        />
                      ))}
                  {payload.data?.affidavit_uuid && (
                    <DetailRow label="Affidavit UUID" value={payload.data.affidavit_uuid} mono />
                  )}
                </dl>
              </div>

              <p className="text-xs text-charcoal-soft">
                Webhook payload stored in-memory for this demo session. Productionizing:
                persist the inner payload + audit metadata in a tamper-evident store.
              </p>
            </div>
          )}
        </section>
      </PageWithDocs>
    </Shell>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 border-b border-charcoal/10 pb-3 last:border-0 last:pb-0">
      <dt className="text-xs uppercase tracking-wider text-charcoal-soft">{label}</dt>
      <dd className={mono ? 'text-sm font-mono break-all sm:text-right' : 'text-sm sm:text-right'}>
        {value}
      </dd>
    </div>
  );
}

function prettyKey(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/\bpg /g, 'PG-')
    .replace(/\b(\w)/g, (m) => m.toUpperCase());
}

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v as object).length > 0;
  return true;
}

function formatValue(v: unknown): string {
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
