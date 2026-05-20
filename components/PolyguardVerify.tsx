'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, type VerificationSnapshot } from '@/lib/state';
import {
  POLYGUARD_API_SERVER,
  POLYGUARD_APP_ID,
  REQUIRED_PROOFS_FOR_KYC,
  REQUIRED_PROOFS_FOR_REVERIFY,
  extractLinkUuid,
  type PolyguardVerifyResponse,
} from '@/lib/polyguard';
import { loadPolyguardClient } from '@/lib/load-polyguard';
import { useIsMobile } from '@/lib/use-is-mobile';
import { Loader2 } from 'lucide-react';

type Props = {
  mode: 'kyc' | 'reverify';
  onComplete?: (snapshot: VerificationSnapshot) => void;
  redirectTo?: string;
};

/**
 * Wraps the Polyguard browser SDK. Dynamically loads it from the CDN to keep
 * it out of SSR (the SDK touches `window` and WebSocket at import time).
 *
 * Two stages once the user completes their Trust Check:
 *   1. SDK resolves with the full verification bundle. We extract link_uuid
 *      from the bundle's redirect_url and immediately stash a snapshot in
 *      Zustand so the next page can render without waiting.
 *   2. We then poll /api/status/[linkUuid] in the background to pick up the
 *      affidavit URL from the webhook. This enriches the snapshot but does
 *      not gate navigation — webhook delivery can lag the SDK resolve by a
 *      few seconds.
 */
export function PolyguardVerify({ mode, onComplete, redirectTo }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const setVerification = useAppStore((s) => s.setVerification);

  const [phase, setPhase] = useState<
    'idle' | 'loading-sdk' | 'awaiting-scan' | 'done' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setPhase('loading-sdk');
      setErrorMessage(null);
      try {
        const PolyguardClient = await loadPolyguardClient();
        if (cancelled) return;

        const client = new PolyguardClient({
          appId: POLYGUARD_APP_ID,
          apiServer: POLYGUARD_API_SERVER,
          requiredProofs:
            mode === 'kyc' ? REQUIRED_PROOFS_FOR_KYC : REQUIRED_PROOFS_FOR_REVERIFY,
          scanType: 'multi',
        });

        setPhase('awaiting-scan');
        const response = (await client.verify(
          'pg-qr-target',
          /* rawJwt */ true,
        )) as PolyguardVerifyResponse;

        if (cancelled) return;

        const bundle = response?.jwt;
        if (!bundle || typeof bundle !== 'object') {
          // Failure path from the SDK returns `{ presence: { score: 'OFFLINE', msg } }`
          // with no jwt bundle.
          const offlineMsg =
            (response as { presence?: { msg?: string } } | undefined)?.presence?.msg;
          throw new Error(offlineMsg || 'Polyguard returned no verification bundle');
        }

        const linkUuid = extractLinkUuid(response);
        if (!linkUuid) {
          throw new Error(
            'Polyguard verification bundle missing redirect_url; could not derive link_uuid',
          );
        }

        // Stash the SDK snapshot and advance immediately. WebhookEnrichment
        // (mounted in the origination layout) picks it up and polls
        // /api/status/[linkUuid] in the background — that poll survives this
        // component unmounting on navigation.
        const snapshot: VerificationSnapshot = {
          linkUuid,
          source: 'sdk',
          status: bundle.status,
          reason: bundle.reason ?? null,
          presence: bundle.presence,
          verification: bundle.verification,
        };
        setVerification(snapshot);
        onComplete?.(snapshot);
        setPhase('done');

        if (redirectTo) router.push(redirectTo);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : 'Verification failed unexpectedly';
        if (/cancel/i.test(msg)) {
          setPhase('idle');
          return;
        }
        setErrorMessage(msg);
        setPhase('error');
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [mode, redirectTo, onComplete, router, setVerification]);

  const showOverlay =
    phase === 'idle' || phase === 'loading-sdk' || phase === 'done' || phase === 'error';

  const overlayLabel =
    phase === 'loading-sdk'
      ? 'Loading Polyguard…'
      : phase === 'done'
      ? 'Trust Check verified — continuing…'
      : 'Starting…';

  return (
    <div className="card flex flex-col items-center gap-4">
      {/* SDK owns #pg-qr-target. No React children inside (would fight the
          SDK for the div). The target needs explicit dimensions or the
          injected QR SVG collapses to 0x0 in embedded mode. */}
      <div className="relative w-[280px] h-[280px] max-w-full flex items-center justify-center">
        <div
          id="pg-qr-target"
          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
        />
        {showOverlay && phase !== 'error' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Spinner label={overlayLabel} />
          </div>
        )}
      </div>

      <div className="text-center text-sm text-charcoal-soft max-w-prose">
        {phase === 'awaiting-scan' && !isMobile && (
          <>
            <p className="font-medium text-charcoal">
              Scan this code with Polyguard Mobile
            </p>
            <p className="mt-1">
              Don&apos;t have it yet? Install Polyguard Mobile from the App Store or
              Play Store, then scan the code above.
            </p>
          </>
        )}
        {phase === 'awaiting-scan' && isMobile && (
          <p className="font-medium text-charcoal">
            Tap the button above to open Polyguard Mobile and complete your Trust
            Check.
          </p>
        )}
        {phase === 'error' && (
          <div className="text-error">
            <p className="font-medium">Verification failed</p>
            <p className="mt-1 text-xs">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setPhase('idle')}
              className="mt-3 btn-secondary text-xs"
              data-tap
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-charcoal-soft">
      <Loader2 className="h-8 w-8 animate-spin text-sage-strong" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
