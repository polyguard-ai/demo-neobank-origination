/**
 * SSRF / open-redirect defense.
 * The presigned `affidavit_url` arrives from the Polyguard webhook. Even though
 * the webhook itself is authenticated (AES-256-GCM), we belt-and-braces the
 * outbound link against a configurable host allow-list before exposing it as a
 * clickable button.
 */
const DEFAULT_ALLOWLIST = [
  'polyguard.ai',
  's3.amazonaws.com',
  's3.us-west-2.amazonaws.com',
];

export function getAllowlist(): string[] {
  const raw = process.env.POLYGUARD_AFFIDAVIT_HOST_ALLOWLIST;
  if (!raw) return DEFAULT_ALLOWLIST;
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function validateAffidavitUrl(
  url: string,
  allowlist: string[] = getAllowlist(),
): { ok: true; href: string } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'Affidavit URL is not a valid URL.' };
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Affidavit URL must use HTTPS.' };
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = allowlist.some(
    (h) => host === h || host.endsWith('.' + h),
  );
  if (!allowed) {
    return {
      ok: false,
      reason: `Affidavit URL host '${host}' is not in the allow-list.`,
    };
  }
  return { ok: true, href: parsed.toString() };
}
