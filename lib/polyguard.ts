/**
 * Polyguard browser SDK is loaded from Polyguard's public CDN as an IIFE
 * bundle, which exposes `window.Polyguard.Client`. We deliberately avoid the
 * npm package so that this demo can be forked and deployed by customers who
 * don't have access to private Polyguard package registries.
 *
 * See `lib/load-polyguard.ts` for the script loader.
 */
export const POLYGUARD_APP_ID =
  process.env.NEXT_PUBLIC_POLYGUARD_APP_ID || 'demo-beige-bank';
export const POLYGUARD_API_SERVER =
  process.env.NEXT_PUBLIC_POLYGUARD_API_SERVER || 'api.polyguard.ai';

export const POLYGUARD_SDK_URL =
  process.env.NEXT_PUBLIC_POLYGUARD_SDK_URL ||
  'https://cdn.polyguard.ai/sdk/latest/sdk.js';

/**
 * Shape of the resolved value from `client.verify(target, rawJwt = true)`.
 *
 * The SDK resolves with `{ jwt: <the WebSocket message body> }`. That body is
 * an OBJECT — not a JWT string — even though the field is named `jwt`. It
 * contains the decoded verification bundle plus the actual signed JWT in
 * `raw_jwt`.
 *
 * `link_uuid` is NOT a top-level field anywhere in this payload. It is the
 * last path segment of `redirect_url` (`/success/{link_uuid}`).
 */
export type PolyguardJwtBundle = {
  status?: 'success' | 'failure';
  reason?: string | null;
  redirect_url?: string;
  sub?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  pg_jwt_type?: string;
  presence?: { score: string | number; [k: string]: unknown };
  verification?: Record<string, unknown>;
  jwts?: Record<string, unknown>;
  raw_jwt?: string;
  [k: string]: unknown;
};

export type PolyguardVerifyResponse = {
  jwt?: PolyguardJwtBundle;
  presence?: { score: string | number };
  [k: string]: unknown;
};

/**
 * Extract the link_uuid from a verify() response. The SDK doesn't surface
 * link_uuid directly, but the backend embeds it as the last path segment of
 * `redirect_url` — `/success/{link_uuid}`.
 */
export function extractLinkUuid(response: PolyguardVerifyResponse): string | undefined {
  const redirect = response?.jwt?.redirect_url;
  if (!redirect || typeof redirect !== 'string') return undefined;
  const m = redirect.match(/\/success\/([^/?#]+)/);
  return m?.[1];
}

export type PolyguardClientConstructor = new (config: {
  appId: string;
  apiServer: string;
  requiredProofs?: string[];
  scanType?: 'single' | 'multi';
  [k: string]: unknown;
}) => {
  verify(target?: string, rawJwt?: boolean): Promise<string | PolyguardVerifyResponse>;
  require(
    expectedProofs: Record<string, string>,
    target?: string,
  ): Promise<boolean>;
};

declare global {
  interface Window {
    Polyguard?: {
      Client: PolyguardClientConstructor;
    };
  }
}

export const REQUIRED_PROOFS_FOR_KYC = [
  'name',
  'pg_presence',
  'pg_attestation_key_id',
  'pg_region',
];

export const REQUIRED_PROOFS_FOR_REVERIFY = ['pg_presence', 'pg_attestation_key_id'];
