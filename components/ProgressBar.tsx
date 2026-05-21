'use client';
import Link from 'next/link';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useAppStore, useHasHydrated } from '@/lib/state';

type Stop = { slug: string; label: string; href: string };

const STOPS: Stop[] = [
  { slug: 'verify', label: 'Verify', href: '/verify' },
  { slug: 'verified', label: 'Verified', href: '/verified' },
  { slug: 'apply', label: 'Confirm', href: '/apply' },
  { slug: 'fund', label: 'Fund', href: '/fund' },
  { slug: 'affidavit', label: 'Affidavit', href: '#' },
];

export function ProgressBar({ current }: { current: string }) {
  const hasHydrated = useHasHydrated();
  const verification = useAppStore((s) => s.verification);
  const applicantEmail = useAppStore((s) => s.applicant.email);
  const account = useAppStore((s) => s.account);

  // A step is "completed" when the work it represents has been done.
  // Reachability of step N then requires step N-1 to be completed.
  // Pre-hydration we treat everything as locked except the current step,
  // so we never render a clickable link to something we'd punt back from.
  const completed = (slug: string): boolean => {
    if (!hasHydrated) return false;
    switch (slug) {
      case 'verify':
      case 'verified':
        return !!verification;
      case 'apply':
        return !!applicantEmail;
      case 'fund':
        return !!account;
      default:
        return false;
    }
  };

  const currentIndex = STOPS.findIndex((s) => s.slug === current);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStop = STOPS[safeIndex];

  const reachable = (i: number): boolean => {
    if (i === safeIndex) return true;
    if (i === 0) return true;
    return completed(STOPS[i - 1].slug);
  };

  const hrefFor = (stop: Stop): string => {
    if (stop.slug === 'affidavit') {
      return verification?.linkUuid
        ? `/admin/affidavit/${verification.linkUuid}`
        : '#';
    }
    return stop.href;
  };

  const prevStop = STOPS[safeIndex - 1];
  const nextStop = STOPS[safeIndex + 1];
  const prevReachable =
    !!prevStop && reachable(safeIndex - 1) && hrefFor(prevStop) !== '#';
  const nextReachable =
    !!nextStop && reachable(safeIndex + 1) && hrefFor(nextStop) !== '#';

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
          href={prevStop ? hrefFor(prevStop) : '#'}
          enabled={prevReachable}
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
          href={nextStop ? hrefFor(nextStop) : '#'}
          enabled={nextReachable}
        />
      </div>
      {/* Desktop — labeled */}
      <ol className="hidden md:flex mx-auto max-w-7xl px-6 lg:px-8 py-3 items-center gap-1">
        {STOPS.map((stop, i) => {
          const isActive = i === safeIndex;
          const isPast = i < safeIndex;
          const stopHref = hrefFor(stop);
          const isLink = !isActive && reachable(i) && stopHref !== '#';
          const isLocked = !isLink && !isActive;
          const contents = (
            <>
              <span className="font-mono text-[0.7rem] opacity-70">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{stop.label}</span>
              {isLocked && (
                <Lock className="h-3 w-3 opacity-50" aria-hidden />
              )}
            </>
          );
          return (
            <li key={stop.slug} className="flex items-center gap-2">
              {isLink ? (
                <Link
                  href={stopHref}
                  aria-current={isActive ? 'step' : undefined}
                  className={clsx(
                    'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md transition-colors',
                    isPast
                      ? 'text-sage-strong hover:bg-sage-soft/40'
                      : 'text-charcoal-soft hover:bg-beige-dark',
                  )}
                >
                  {contents}
                </Link>
              ) : (
                <span
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={!isActive || undefined}
                  title={isLocked ? 'Complete the previous step to unlock' : undefined}
                  className={clsx(
                    'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md',
                    isActive && 'bg-charcoal text-beige-light',
                    isLocked && 'text-charcoal/40 cursor-not-allowed',
                  )}
                >
                  {contents}
                </span>
              )}
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
  href,
  enabled,
}: {
  direction: 'prev' | 'next';
  stop: Stop | undefined;
  href: string;
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
    <Link href={href} aria-label={label} className={className} data-tap>
      <Icon className="h-5 w-5" aria-hidden />
    </Link>
  );
}
