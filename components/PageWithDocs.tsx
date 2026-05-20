import { DocsPanelLoader } from './DocsPanelLoader';
import { DocsToggle } from './DocsToggle';
import { ProgressBar } from './ProgressBar';

type Slug = 'landing' | 'apply' | 'verify' | 'verified' | 'fund' | 'affidavit' | 'compare';

export function PageWithDocs({
  slug,
  showProgress = true,
  children,
}: {
  slug: Slug;
  showProgress?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {showProgress && <ProgressBar current={slug} />}
      <div data-page-content className="page-content">
        {children}
      </div>
      <DocsPanelLoader slug={slug} />
      <DocsToggle mode="mobile" />
      <DocsToggle mode="tablet" />
    </>
  );
}
