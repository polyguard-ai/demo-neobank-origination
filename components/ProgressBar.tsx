'use client';
import Link from 'next/link';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const prevStop = STOPS[safeIndex - 1];
  const nextStop = STOPS[safeIndex + 1];
  const prevEnabled = !!prevStop && prevStop.href !== '#';
  const nextEnabled = !!nextStop && nextStop.href !== '#';
  return (
    <nav
      aria-label="Account opening progress"
      className="border-b border-charcoal/10 bg-beige-light/70 backdrop-blur"
    >
      {/* Mobile — compact, with prev/next */}
      <div className="md:hidden mx-auto max-w-7xl px-3 py-3 flex items-center gap-2">
        <StepArrow
          direction="prev"
          stop={prevStop}
          enabled={prevEnabled}
        />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.7rem] uppercase tracking-wider text-charcoal-soft whitespace-nowrap">
              Step {safeIndex + 1} of {STOPS.length}
            </span>
            <span className="text-sm font-medium truncate">{currentStop.label}</span>
          </div>
          <div className="h-1.5 rounded-full bg-beige-dark overflow-hidden">
            <div
              className="h-full bg-sage-strong rounded-full transition-all"
              style={{ width: `${((safeIndex + 1) / STOPS.length) * 100}%` }}
            />
          </div>
        </div>
        <StepArrow
          direction="next"
          stop={nextStop}
          enabled={nextEnabled}
        />
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

function StepArrow({
  direction,
  stop,
  enabled,
}: {
  direction: 'prev' | 'next';
  stop: (typeof STOPS)[number] | undefined;
  enabled: boolean;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  const label =
    direction === 'prev'
      ? stop
        ? `Previous step: ${stop.label}`
        : 'No previous step'
      : stop
      ? `Next step: ${stop.label}`
      : 'No next step';
  const className = clsx(
    'shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-md transition-colors',
    enabled
      ? 'text-charcoal hover:bg-beige-dark active:bg-beige-dark/80'
      : 'text-charcoal/25 cursor-not-allowed',
  );
  if (!enabled || !stop) {
    return (
      <span aria-label={label} aria-disabled className={className}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
    );
  }
  return (
    <Link href={stop.href} aria-label={label} className={className} data-tap>
      <Icon className="h-5 w-5" aria-hidden />
    </Link>
  );
}
