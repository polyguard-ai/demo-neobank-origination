import { DocsPanel, type DocMeta } from './DocsPanel';
import * as LandingDoc from '@/content/docs/01-landing.mdx';
import * as VerifyDoc from '@/content/docs/02-verify.mdx';
import * as VerifiedDoc from '@/content/docs/03-verified.mdx';
import * as ApplyDoc from '@/content/docs/04-apply.mdx';
import * as FundDoc from '@/content/docs/05-fund.mdx';
import * as AffidavitDoc from '@/content/docs/06-affidavit.mdx';
import * as CompareDoc from '@/content/docs/07-compare.mdx';

type DocModule = { default: React.ComponentType; meta?: DocMeta };

const REGISTRY: Record<string, DocModule> = {
  landing: LandingDoc as DocModule,
  verify: VerifyDoc as DocModule,
  verified: VerifiedDoc as DocModule,
  apply: ApplyDoc as DocModule,
  fund: FundDoc as DocModule,
  affidavit: AffidavitDoc as DocModule,
  compare: CompareDoc as DocModule,
};

export function DocsPanelLoader({ slug }: { slug: keyof typeof REGISTRY }) {
  const mod = REGISTRY[slug];
  if (!mod) return null;
  const Doc = mod.default;
  const meta: DocMeta = mod.meta ?? {
    title: 'Tour',
    summary: '',
  };
  return (
    <DocsPanel meta={meta}>
      <Doc />
    </DocsPanel>
  );
}
