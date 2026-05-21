'use client';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { useAppStore, useHasHydrated } from '@/lib/state';

export function ResetSessionButton() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const hasSession = useAppStore(
    (s) => !!s.verification || !!s.account || !!s.applicant.email,
  );
  const reset = useAppStore((s) => s.reset);

  if (!hasHydrated || !hasSession) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (
          window.confirm(
            'Reset the demo? This clears your verification, account, and any in-progress data.',
          )
        ) {
          reset();
          router.push('/verify');
        }
      }}
      aria-label="Reset demo session"
      className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs text-charcoal-soft hover:text-charcoal hover:bg-beige-dark transition-colors"
      data-tap
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">Reset</span>
    </button>
  );
}
