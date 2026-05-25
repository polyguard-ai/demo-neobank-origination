'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, type VerificationSnapshot } from '@/lib/state';
import {
  runPolyguardVerify,
  PolyguardCancelled,
} from '@/lib/run-polyguard-verify';
import { useIsMobile } from '@/lib/use-is-mobile';
import { Loader2 } from 'lucide-react';

type Props = {
  mode: 'kyc' | 'reverify';
  onComplete?: (snapshot: VerificationSnapshot) => void;
  /**
   * Same-tab navigation after the SDK promise resolves. Use for desktop
   * QR-scan flows where the originating tab is the one that should advance.
   * Ignored when ``redirectPath`` is set (the new tab opened by PSL takes
   * over) — except as a fallback for desktop, where the SDK promise still
   * resolves with the JWT and we navigate the same tab.
   */
  redirectTo?: string;
  /**
   * Forwarded to the SDK. When set, the Polyguard backend appends
   * ``?link_uuid=…`` and the mobile app opens this same-origin path in a
   * new tab. The originating tab gets the SDK's "you may close this tab"
   * overlay. Pair with a destination route that hydrates state from the
   * URL ``link_uuid`` so the new tab can advance the flow independently.
   */
  redirectPath?: string;
};

/**
 * Embedded Trust Check — owns the in-page #pg-qr-target div. The SDK
 * injects a QR SVG (desktop) or a deep-link button (mobile) into it.
 *
 * For the modal-style variant (full-screen overlay built by the SDK itself)
 * call `runPolyguardVerify({ mode })` directly — no target, no host div —
 * and react to the resolved snapshot in the caller. See /fund for the
 * canonical example.
 */
export function PolyguardVerify({ mode, onComplete, redirectTo, redirectPath }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const setVerification = useAppStore((s) => s.setVerification);

  const [phase, setPhase] = useState<
    'idle' | 'loading-sdk' | 'awaiting-scan' | 'done' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Hold callbacks/strings in refs so the effect that drives the SDK doesn't
  // re-run (and orphan its WebSocket) when the parent rerenders with a new
  // inline `onComplete` identity.
  const onCompleteRef = useRef(onComplete);
  const redirectToRef = useRef(redirectTo);
  const redirectPathRef = useRef(redirectPath);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    redirectToRef.current = redirectTo;
  }, [redirectTo]);
  useEffect(() => {
    redirectPathRef.current = redirectPath;
  }, [redirectPath]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setPhase('loading-sdk');
      setErrorMessage(null);
      try {
        // The SDK has a brief window between us calling verify() and
        // it painting into #pg-qr-target. Flip the phase to
        // 'awaiting-scan' first so the spinner overlay is in front of
        // whatever the SDK is doing.
        setPhase('awaiting-scan');

        const snapshot = await runPolyguardVerify({
          mode,
          target: 'pg-qr-target',
          redirectPath: redirectPathRef.current,
        });
        if (cancelled) return;

        setVerification(snapshot);
        onCompleteRef.current?.(snapshot);
        setPhase('done');

        // Skip the same-tab redirect when ``redirectPath`` is set — the
        // SDK has already painted its "you may close this tab" overlay
        // over our target div and the mobile app has opened the
        // ``redirectPath`` destination in a new tab. Navigating this tab
        // would wipe the overlay and leave the user on a half-loaded
        // version of the redirect URL.
        const redirect = redirectToRef.current;
        if (redirect && !redirectPathRef.current) router.push(redirect);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof PolyguardCancelled) {
          setPhase('idle');
          return;
        }
        const msg =
          err instanceof Error ? err.message : 'Verification failed unexpectedly';
        setErrorMessage(msg);
        setPhase('error');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [mode, router, setVerification, retryToken]);

  const showOverlay =
    phase === 'idle' || phase === 'loading-sdk' || phase === 'done';

  const overlayLabel =
    phase === 'loading-sdk'
      ? 'Loading Polyguard…'
      : phase === 'done'
      ? 'Trust Check verified — continuing…'
      : 'Starting…';

  // The SDK injects different content per device: a QR SVG on desktop,
  // a deep-link button on mobile. Size the host container accordingly —
  // a small fixed square on desktop, auto-sized on mobile so the button
  // doesn't sit inside a giant empty box.
  const targetWrapperClass = isMobile
    ? 'relative inline-flex items-center justify-center min-h-[3rem]'
    : 'relative w-[180px] h-[180px] max-w-full flex items-center justify-center';
  const targetClass = isMobile
    ? 'inline-flex items-center justify-center'
    : 'w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full';

  return (
    <div className="card flex flex-col items-center gap-3 max-w-sm mx-auto">
      {/* SDK owns #pg-qr-target. No React children — they'd race the SDK
          for the div. The target gets explicit dimensions on desktop or
          the injected QR SVG collapses to 0x0 in embedded mode. */}
      <div className={targetWrapperClass}>
        <div id="pg-qr-target" className={targetClass} />
        {showOverlay && (
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
            <p className="mt-1 text-xs">
              Don&apos;t have it yet? Install Polyguard Mobile from the App Store
              or Play Store, then scan above.
            </p>
          </>
        )}
        {phase === 'awaiting-scan' && isMobile && (
          <p className="font-medium text-charcoal">
            Tap above to open Polyguard Mobile and complete your Trust Check.
          </p>
        )}
        {phase === 'error' && (
          <div className="text-error">
            <p className="font-medium">Verification failed</p>
            <p className="mt-1 text-xs">{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setPhase('idle');
                setRetryToken((n) => n + 1);
              }}
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
    <div className="flex flex-col items-center gap-2 text-charcoal-soft">
      <Loader2 className="h-7 w-7 animate-spin text-sage-strong" />
      <span className="text-xs">{label}</span>
    </div>
  );
}
