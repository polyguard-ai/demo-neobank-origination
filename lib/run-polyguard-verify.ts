'use client';
import {
  POLYGUARD_API_SERVER,
  POLYGUARD_APP_ID,
  REQUIRED_PROOFS_FOR_KYC,
  REQUIRED_PROOFS_FOR_REVERIFY,
  extractLinkUuid,
  type PolyguardVerifyResponse,
} from './polyguard';
import { loadPolyguardClient } from './load-polyguard';
import { type VerificationSnapshot } from './state';

/**
 * The SDK rejects only in one case: the user closes the built-in modal.
 * We surface it as a typed error so callers don't string-match.
 */
export class PolyguardCancelled extends Error {
  constructor() {
    super('User cancelled');
    this.name = 'PolyguardCancelled';
  }
}

export type VerifyTrigger = {
  mode: 'kyc' | 'reverify';
  /**
   * DOM element id to host the embedded QR / mobile-button. Omit to use the
   * SDK's built-in modal — the SDK appends its own full-screen overlay to
   * document.body, complete with close + cancel buttons.
   *
   * See `polyguard-ai/web-sdk` → `PolyguardWebsocketClientImpl.verify` for
   * the dispatch: a truthy `target` selects embedded mode, falsy selects
   * modal mode.
   */
  target?: string;
  /**
   * Same-origin path the Polyguard backend appends ``?link_uuid=…`` to and
   * sends the mobile app to once verification completes. The originating
   * browser tab is left alive (UL/App-Link interception preserves it) and
   * the SDK paints a "you may close this tab" overlay over its UI. The
   * new tab loaded at this path is where the actual customer flow
   * continues — typically with ``link_uuid`` in the URL driving the
   * webhook poll. Use this when forwarding the user to a next-step page.
   */
  redirectPath?: string;
  /**
   * Opt into the mobile "tap ← back to your browser" prompt instead of
   * opening a redirect URL. Use this for in-line re-verifications (e.g.,
   * the funding step) where the user is already on the right page and
   * a new tab would be friction. Mutually exclusive with redirectPath;
   * the SDK warns and prefers returnToBrowser when both are set.
   */
  returnToBrowser?: boolean;
};

/**
 * Imperative wrapper around `client.verify()`. Loads the SDK, builds a
 * client with the right required-proofs list for the given mode, and
 * resolves with the snapshot a caller can pass straight to
 * `useAppStore.setVerification`.
 *
 * The companion `WebhookEnrichment` (mounted in the origination layout)
 * picks the snapshot up from the store and polls /api/status/{linkUuid}
 * until the webhook lands.
 */
export async function runPolyguardVerify(
  { mode, target, redirectPath, returnToBrowser }: VerifyTrigger,
): Promise<VerificationSnapshot> {
  const Client = await loadPolyguardClient();
  const client = new Client({
    appId: POLYGUARD_APP_ID,
    apiServer: POLYGUARD_API_SERVER,
    requiredProofs:
      mode === 'kyc' ? REQUIRED_PROOFS_FOR_KYC : REQUIRED_PROOFS_FOR_REVERIFY,
    scanType: 'multi',
    redirectPath,
    returnToBrowser,
  });

  let response: PolyguardVerifyResponse;
  try {
    response = (await client.verify(target, true)) as PolyguardVerifyResponse;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(msg)) throw new PolyguardCancelled();
    throw err;
  }

  const bundle = response?.jwt;
  if (!bundle || typeof bundle !== 'object') {
    // Failure paths (offline, websocket error, etc.) resolve (not reject)
    // with `{ presence: { score: 'OFFLINE', msg } }`.
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

  return {
    linkUuid,
    source: 'sdk',
    status: bundle.status,
    reason: bundle.reason ?? null,
    presence: bundle.presence,
    verification: bundle.verification,
  };
}
