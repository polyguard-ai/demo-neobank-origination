'use client';
import { useEffect, useRef } from 'react';
import { useAppStore, type VerificationSnapshot } from '@/lib/state';

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 120_000;

/**
 * Runs at the origination-layout level (so it survives navigation between
 * /verify, /verified, /apply, /fund). When the store holds a verification
 * snapshot sourced from the SDK, we poll /api/status/[linkUuid] until the
 * Polyguard webhook lands, then patch the snapshot with the affidavit URL
 * and webhook-side verification claims.
 *
 * Mounting this in the layout (rather than inside PolyguardVerify) means
 * the poll keeps running after we navigate the user off /verify the
 * moment the SDK resolves.
 */
export function WebhookEnrichment() {
  const verification = useAppStore((s) => s.verification);
  const setVerification = useAppStore((s) => s.setVerification);

  // Track which link_uuid we are currently polling for, so we don't restart
  // the poll on every render and don't leak overlapping fetches when the
  // user runs a second Trust Check.
  const activeLinkUuid = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const needsEnrichment =
      verification?.source === 'sdk' &&
      !!verification.linkUuid &&
      !verification.affidavitUrl;

    if (!needsEnrichment) {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
        activeLinkUuid.current = null;
      }
      return;
    }

    const linkUuid = verification.linkUuid;
    if (activeLinkUuid.current === linkUuid) return;

    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    activeLinkUuid.current = linkUuid;

    poll(linkUuid, abort.signal, (patch) => {
      setVerification({ ...verification, ...patch, linkUuid });
    });

    return () => {
      abort.abort();
    };
  }, [verification, setVerification]);

  return null;
}

async function poll(
  linkUuid: string,
  signal: AbortSignal,
  onEnriched: (patch: Partial<VerificationSnapshot>) => void,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    if (signal.aborted) return;
    try {
      const res = await fetch(`/api/status/${encodeURIComponent(linkUuid)}`, {
        signal,
        cache: 'no-store',
      });
      if (res.status === 200) {
        const body = await res.json();
        const data = body?.data ?? {};
        onEnriched({
          source: 'webhook',
          event: body.event,
          status: body.event === 'trust_check.completed' ? 'success' : 'failure',
          reason: data.reason ?? null,
          verification: data.verification,
          affidavitUrl: data.affidavit_url,
          affidavitUuid: data.affidavit_uuid,
        });
        return;
      }
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return;
    }
    await sleep(POLL_INTERVAL_MS, signal);
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(() => resolve(), ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}
