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

export type PolyguardVerifyResponse = {
  jwt?: string;
  link_uuid?: string;
  presence?: { score: string | number };
  redirect_url?: string;
  [k: string]: unknown;
};

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
