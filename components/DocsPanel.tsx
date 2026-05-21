'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore, useHasHydrated } from '@/lib/state';
import { useBreakpoint } from '@/lib/use-is-mobile';

export type DocMeta = {
  title: string;
  summary: string;
  stepNumber?: number;
  links?: { label: string; href: string }[];
};

/**
 * Renders the same MDX content across three responsive modes:
 *  - mobile (<md):  full-screen bottom Sheet
 *  - tablet (md):   right-side drawer
 *  - desktop (lg+): persistent right rail (collapsible to gutter)
 */
export function DocsPanel({
  meta,
  children,
}: {
  meta: DocMeta;
  children: React.ReactNode;
}) {
  const hasHydrated = useHasHydrated();
  const persistedCollapsed = useAppStore((s) => s.docsCollapsed);
  const setCollapsed = useAppStore((s) => s.setDocsCollapsed);
  const bp = useBreakpoint();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Treat the drawer as collapsed until the persisted state is loaded — avoids
  // a flash of the auto-opened mobile sheet on first render.
  const collapsed = hasHydrated ? persistedCollapsed : true;

  useEffect(() => {
    document.documentElement.dataset.docsCollapsed = collapsed ? 'true' : 'false';
  }, [collapsed]);

  if (bp === 'mobile' || bp === 'tablet') {
    return (
      <>
        <div
          aria-hidden={collapsed}
          className={clsx(
            'fixed inset-0 z-40 bg-charcoal/40 transition-opacity',
            collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100',
          )}
          onClick={() => setCollapsed(true)}
        />
        <aside
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Guided tour"
          className={clsx(
            'fixed z-50 bg-beige-light shadow-2xl transition-transform',
            bp === 'mobile'
              ? 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl'
              : 'top-0 bottom-0 right-0 w-[420px] max-w-[90vw]',
            collapsed
              ? bp === 'mobile'
                ? 'translate-y-full'
                : 'translate-x-full'
              : 'translate-y-0 translate-x-0',
          )}
        >
          <div className="flex items-start justify-between gap-3 p-4 border-b border-charcoal/10">
            <div>
              {meta.stepNumber !== undefined && (
                <p className="text-[0.7rem] uppercase tracking-wider text-sage-strong">
                  Tour stop {meta.stepNumber}
                </p>
              )}
              <h2 className="font-serif text-xl text-charcoal mt-0.5">{meta.title}</h2>
              <p className="text-sm text-charcoal-soft mt-1">{meta.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Close tour"
              className="-mr-1 -mt-1 h-9 w-9 rounded-full hover:bg-beige-dark flex items-center justify-center"
              data-tap
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className="overflow-y-auto p-4 pb-20"
            style={{ maxHeight: 'calc(85dvh - 80px)' }}
          >
            {children}
            {meta.links && meta.links.length > 0 && <Links links={meta.links} />}
          </div>
        </aside>
      </>
    );
  }

  // Desktop rail — fixed to the right, page reserves width via CSS in globals.css
  return (
    <aside
      data-docs-rail
      className="hidden lg:block fixed right-0 top-14 bottom-0 border-l border-charcoal/10 bg-beige-light/90 backdrop-blur z-20"
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Open tour panel' : 'Collapse tour panel'}
        className="absolute top-3 -left-3 h-7 w-7 rounded-full bg-charcoal text-beige-light flex items-center justify-center shadow-sm hover:bg-charcoal-soft transition-colors z-10"
      >
        <span className="text-xs leading-none">{collapsed ? '‹' : '›'}</span>
      </button>
      <div
        data-docs-rail-content
        className="h-full overflow-y-auto p-5 transition-opacity duration-200"
      >
        {meta.stepNumber !== undefined && (
          <p className="text-[0.7rem] uppercase tracking-wider text-sage-strong">
            Tour stop {meta.stepNumber}
          </p>
        )}
        <h2 className="font-serif text-2xl text-charcoal mt-1">{meta.title}</h2>
        <p className="text-sm text-charcoal-soft mt-1.5 mb-4">{meta.summary}</p>
        {children}
        {meta.links && meta.links.length > 0 && <Links links={meta.links} />}
      </div>
    </aside>
  );
}

function Links({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="mt-6 pt-4 border-t border-charcoal/10">
      <p className="text-[0.7rem] uppercase tracking-wider text-charcoal-soft mb-2">
        Learn more
      </p>
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="text-sm text-sage-strong underline underline-offset-2 hover:text-sage"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
