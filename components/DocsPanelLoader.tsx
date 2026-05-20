import { DocsPanel, type DocMeta } from './DocsPanel';
import * as Stop01 from '@/content/docs/01-landing.mdx';
import * as Stop02 from '@/content/docs/02-apply.mdx';
import * as Stop03 from '@/content/docs/03-verify.mdx';
import * as Stop04 from '@/content/docs/04-verified.mdx';
import * as Stop05 from '@/content/docs/05-fund.mdx';
import * as Stop06 from '@/content/docs/06-affidavit.mdx';
import * as Stop07 from '@/content/docs/07-compare.mdx';

type DocModule = { default: React.ComponentType; meta?: DocMeta };

const REGISTRY: Record<string, DocModule> = {
  landing: Stop01 as DocModule,
  apply: Stop02 as DocModule,
  verify: Stop03 as DocModule,
  verified: Stop04 as DocModule,
  fund: Stop05 as DocModule,
  affidavit: Stop06 as DocModule,
  compare: Stop07 as DocModule,
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
