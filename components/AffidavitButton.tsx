'use client';
import { useState } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { validateAffidavitUrl } from '@/lib/affidavit-url';

/**
 * Opens the presigned Transaction Affidavit URL in a new tab,
 * after checking it against the host allow-list.
 */
export function AffidavitButton({
  href,
  allowlist,
}: {
  href: string | undefined;
  allowlist?: string[];
}) {
  const [error, setError] = useState<string | null>(null);

  if (!href) {
    return (
      <button type="button" disabled className="btn-secondary w-full sm:w-auto opacity-60">
        Affidavit not yet available
      </button>
    );
  }

  const onClick = () => {
    const result = validateAffidavitUrl(href, allowlist);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    window.open(result.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <button
        type="button"
        onClick={onClick}
        className="btn-sage w-full sm:w-auto"
        data-tap
      >
        <FileText className="h-4 w-4" />
        View Transaction Affidavit (PDF)
      </button>
      {error && (
        <p className="text-xs text-error flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
