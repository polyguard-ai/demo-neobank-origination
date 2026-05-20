'use client';
import { PageWithDocs } from '@/components/PageWithDocs';
import { PolyguardVerify } from '@/components/PolyguardVerify';

export default function VerifyPage() {
  return (
    <PageWithDocs slug="verify">
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal">
          Verify your identity
        </h1>
        <p className="text-charcoal-soft mt-2 max-w-prose">
          This is the one place Beige Bank&apos;s flow hands off to Polyguard.
          On desktop, scan the QR with Polyguard Mobile. On a phone, you&apos;ll
          deep-link straight in.
        </p>
        <div className="mt-8">
          <PolyguardVerify mode="kyc" redirectTo="/verified" />
        </div>
      </section>
    </PageWithDocs>
  );
}
