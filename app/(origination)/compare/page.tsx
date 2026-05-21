import { PageWithDocs } from '@/components/PageWithDocs';
import { ComparisonTable } from '@/components/ComparisonTable';

export default function ComparePage() {
  return (
    <PageWithDocs slug="compare" showProgress={false}>
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-charcoal">
          One-time KYC vs. continuous verification
        </h1>
        <p className="text-charcoal-soft mt-2 max-w-prose">
          Legacy KYC verifies that a document exists. Polyguard verifies the person
          using it — on a real device, in a real place, right now. And it does so
          again every time the stakes are high.
        </p>
        <div className="mt-8">
          <ComparisonTable />
        </div>
      </section>
    </PageWithDocs>
  );
}
