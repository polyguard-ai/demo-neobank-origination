'use client';
import { BookOpen, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore, useHasHydrated } from '@/lib/state';

export function DocsToggle({ mode }: { mode: 'mobile' | 'tablet' | 'rail' }) {
  const hasHydrated = useHasHydrated();
  const persistedCollapsed = useAppStore((s) => s.docsCollapsed);
  const collapsed = hasHydrated ? persistedCollapsed : true;
  const toggle = useAppStore((s) => s.toggleDocs);

  if (mode === 'rail') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Open tour panel' : 'Collapse tour panel'}
        className="absolute top-3 -left-3 h-7 w-7 rounded-full bg-charcoal text-beige-light flex items-center justify-center shadow-sm hover:bg-charcoal-soft transition-colors"
        data-tap
      >
        {collapsed ? (
          <BookOpen className="h-3.5 w-3.5" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? 'Open guided tour' : 'Close guided tour'}
      className={clsx(
        'fixed z-40 bottom-4 right-4 inline-flex items-center gap-2 rounded-full shadow-lg shadow-charcoal/15 transition-all',
        'bg-charcoal text-beige-light px-4 py-3 text-sm font-medium hover:bg-charcoal-soft',
        mode === 'tablet' && 'lg:hidden',
        mode === 'mobile' && 'md:hidden',
        !collapsed && 'opacity-0 pointer-events-none',
      )}
      data-tap
    >
      <BookOpen className="h-4 w-4" />
      <span>Guided tour</span>
    </button>
  );
}
