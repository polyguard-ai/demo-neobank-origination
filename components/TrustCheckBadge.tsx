import { ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export function TrustCheckBadge({
  label = 'Trust Check verified',
  tone = 'sage',
}: {
  label?: string;
  tone?: 'sage' | 'beige';
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'sage' && 'bg-sage-soft text-sage-strong',
        tone === 'beige' && 'bg-beige-dark text-charcoal',
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
