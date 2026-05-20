import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { PageWithDocs } from '@/components/PageWithDocs';
import { TrustCheckBadge } from '@/components/TrustCheckBadge';
import { ShieldCheck, Zap, FileCheck2, EyeOff } from 'lucide-react';

export default function LandingPage() {
  return (
    <Shell>
      <PageWithDocs slug="landing" showProgress={false}>
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-12">
          <TrustCheckBadge label="Powered by Polyguard" />
          <h1 className="hero-title mt-4">
            Open an account in
            <br />
            five minutes.
            <span className="block text-sage-strong">Verified, not just checked.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-charcoal-soft max-w-2xl">
            Beige Bank is a demonstration neobank built to show how Polyguard prevents
            synthetic-identity, deepfake, and remote-access fraud during account
            origination — without sacrificing speed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link href="/verify" className="btn-primary w-full sm:w-auto" data-tap>
              Open my account
            </Link>
            <Link href="/compare" className="btn-secondary w-full sm:w-auto" data-tap>
              How is this different from legacy KYC?
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid sm:grid-cols-2 gap-4">
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Fused identity verification"
              body="Person, document, device, and location confirmed together — one Trust Check covers all four."
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="PG-Presence in ~100ms"
              body="Optical distance bounding confirms the applicant is physically at the device, closing the remote-access attack surface."
            />
            <Feature
              icon={<EyeOff className="h-5 w-5" />}
              title="Privacy First"
              body="Biometrics never leave the customer's device. Beige Bank never sees them. Polyguard never stores them."
            />
            <Feature
              icon={<FileCheck2 className="h-5 w-5" />}
              title="Court-admissible record"
              body="Every signup produces a signed Transaction Affidavit, certified under NY CPLR § 3122-a for litigation and audit."
            />
          </div>
        </section>
      </PageWithDocs>
    </Shell>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-sage-strong">
        {icon}
        <h3 className="font-medium text-charcoal">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-charcoal-soft">{body}</p>
    </div>
  );
}
