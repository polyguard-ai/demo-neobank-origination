'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, type VerificationSnapshot } from '@/lib/state';
import {
  POLYGUARD_API_SERVER,
  POLYGUARD_APP_ID,
  REQUIRED_PROOFS_FOR_KYC,
  REQUIRED_PROOFS_FOR_REVERIFY,
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
 * Wraps @polyguard/sdk. Dynamically imports the SDK to keep it out of SSR
 * (the SDK touches `window` and WebSocket at import time). Renders an
 * embedded QR target on desktop; on mobile the SDK auto-swaps to a
 * deep-link button into Polyguard Mobile.
 *
 * After the SDK promise resolves, begins polling our /api/status/:linkUuid
 * endpoint for the webhook payload — the webhook is our source of truth
 * for the verification result, not the JWT.
 */
export function PolyguardVerify({ mode, onComplete, redirectTo }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const setVerification = useAppStore((s) => s.setVerification);

  const [phase, setPhase] = useState<
    'idle' | 'loading-sdk' | 'awaiting-scan' | 'awaiting-webhook' | 'done' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [presenceScore, setPresenceScore] = useState<string | number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollAbort: AbortController | null = null;

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
          scanType: 'single',
        });

        setPhase('awaiting-scan');
        const response = (await client.verify(
          'pg-qr-target',
          /* rawJwt */ true,
        )) as PolyguardVerifyResponse;

        if (cancelled) return;
        if (response?.presence?.score) setPresenceScore(response.presence.score);

        // Pull the link_uuid from the SDK response. Fall back to decoding the
        // JWT for `link_uuid` if not directly on the response.
        const linkUuid =
          (typeof response === 'object' && (response.link_uuid as string)) ||
          decodeJwtLinkUuid(response?.jwt);

        if (!linkUuid) {
          throw new Error('Polyguard did not return a link_uuid');
        }

        setPhase('awaiting-webhook');

        // Polling only starts AFTER the SDK promise resolves.
        pollAbort = new AbortController();
        const snapshot = await pollForWebhook(linkUuid, pollAbort.signal);

        if (cancelled) return;

        setVerification(snapshot);
        onComplete?.(snapshot);
        setPhase('done');

        if (redirectTo) {
          router.push(redirectTo);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : 'Verification failed unexpectedly';
        // SDK rejection for user-cancel uses a recognisable message.
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
      pollAbort?.abort();
    };
  }, [mode, redirectTo, onComplete, router, setVerification]);

  const showOverlay =
    phase === 'idle' ||
    phase === 'loading-sdk' ||
    phase === 'awaiting-webhook' ||
    phase === 'error';

  const overlayLabel =
    phase === 'loading-sdk'
      ? 'Loading Polyguard…'
      : phase === 'awaiting-webhook'
      ? 'Confirming your Trust Check…'
      : 'Starting…';

  return (
    <div className="card flex flex-col items-center gap-4">
      {/* SDK owns #pg-qr-target. We never render children into it from React
          (that would fight the SDK for ownership of the div). Status UI sits
          in a sibling overlay above the same footprint.

          In embedded mode the SDK does NOT size the target div — its QR SVG
          inherits the container's box. The target needs explicit dimensions,
          or the QR collapses to 0x0. */}
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
        {phase === 'awaiting-webhook' && (
          <p>
            Trust Check captured — confirming your signed result with our backend.
            {presenceScore !== null && (
              <>
                <br />
                <span className="text-xs font-mono">
                  PG-Presence: {String(presenceScore)}ms
                </span>
              </>
            )}
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

function decodeJwtLinkUuid(jwt?: string): string | undefined {
  if (!jwt) return undefined;
  try {
    const [, payload] = jwt.split('.');
    if (!payload) return undefined;
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(padded));
    if (typeof json.link_uuid === 'string') return json.link_uuid;
    if (typeof json.jti === 'string') return json.jti;
  } catch {
    return undefined;
  }
  return undefined;
}

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60_000;

async function pollForWebhook(
  linkUuid: string,
  signal: AbortSignal,
): Promise<VerificationSnapshot> {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    if (signal.aborted) throw new Error('Polling cancelled');
    const res = await fetch(`/api/status/${encodeURIComponent(linkUuid)}`, {
      signal,
      cache: 'no-store',
    });
    if (res.status === 200) {
      const body = await res.json();
      const data = body?.data ?? {};
      return {
        linkUuid,
        affidavitUrl: data.affidavit_url,
        affidavitUuid: data.affidavit_uuid,
        verification: data.verification,
        event: body.event,
        reason: data.reason ?? null,
      };
    }
    await sleep(POLL_INTERVAL_MS, signal);
  }
  throw new Error(
    'Timed out waiting for the Polyguard webhook. Check your sandbox webhook configuration.',
  );
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(), ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });
}
