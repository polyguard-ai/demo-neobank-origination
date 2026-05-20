'use client';
import Link from 'next/link';
import { clsx } from 'clsx';

const STOPS = [
  { slug: 'landing', label: 'Welcome', href: '/' },
  { slug: 'verify', label: 'Verify', href: '/verify' },
  { slug: 'verified', label: 'Verified', href: '/verified' },
  { slug: 'apply', label: 'Confirm', href: '/apply' },
  { slug: 'fund', label: 'Fund', href: '/fund' },
  { slug: 'affidavit', label: 'Affidavit', href: '#' },
  { slug: 'compare', label: 'Compare', href: '/compare' },
];

export function ProgressBar({ current }: { current: string }) {
  const currentIndex = STOPS.findIndex((s) => s.slug === current);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStop = STOPS[safeIndex];
  return (
    <nav
      aria-label="Account opening progress"
      className="border-b border-charcoal/10 bg-beige-light/70 backdrop-blur"
    >
      {/* Mobile — compact */}
      <div className="md:hidden mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <span className="text-[0.7rem] uppercase tracking-wider text-charcoal-soft whitespace-nowrap">
          Step {safeIndex + 1} of {STOPS.length}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-beige-dark overflow-hidden">
          <div
            className="h-full bg-sage-strong rounded-full transition-all"
            style={{ width: `${((safeIndex + 1) / STOPS.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium">{currentStop.label}</span>
      </div>
      {/* Desktop — labeled */}
      <ol className="hidden md:flex mx-auto max-w-7xl px-6 lg:px-8 py-3 items-center gap-1">
        {STOPS.map((stop, i) => {
          const isActive = i === safeIndex;
          const isPast = i < safeIndex;
          return (
            <li key={stop.slug} className="flex items-center gap-2">
              <Link
                href={stop.href === '#' ? '#' : stop.href}
                aria-current={isActive ? 'step' : undefined}
                className={clsx(
                  'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md transition-colors',
                  isActive && 'bg-charcoal text-beige-light',
                  isPast && 'text-sage-strong hover:bg-sage-soft/40',
                  !isActive && !isPast && 'text-charcoal-soft hover:bg-beige-dark',
                )}
              >
                <span className="font-mono text-[0.7rem] opacity-70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{stop.label}</span>
              </Link>
              {i < STOPS.length - 1 && (
                <span className="text-charcoal/20 select-none" aria-hidden>
                  ·
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
