import { NextResponse } from 'next/server';
import { decryptWebhook, WebhookCryptoError, type WebhookEnvelope } from '@/lib/webhook-crypto';
import { setPayload } from '@/lib/webhook-store';

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid-url';
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Polyguard verification webhook receiver.
 *
 * Envelope:  { v: 1, payload: base64(iv || ciphertext || tag) }
 * Inner:     AES-256-GCM with POLYGUARD_WEBHOOK_SECRET (32-byte base64 key).
 * Idempotency: keyed by inner.link_uuid; same key wins, last-write semantics
 *              is fine for a demo.
 * Replay:   timestamp must be within +/- 5 minutes of now.
 */
export async function POST(req: Request) {
  const secret = process.env.POLYGUARD_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] POLYGUARD_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  let envelope: WebhookEnvelope;
  try {
    envelope = (await req.json()) as WebhookEnvelope;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  try {
    const inner = decryptWebhook(envelope, secret);
    await setPayload(inner);
    const verification = inner.data?.verification ?? {};
    console.log(
      '[webhook] stored payload',
      JSON.stringify({
        event: inner.event,
        link_uuid: inner.link_uuid,
        app_id: inner.app_id,
        timestamp: inner.timestamp,
        sub: inner.data?.sub,
        reason: inner.data?.reason ?? null,
        affidavit_uuid: inner.data?.affidavit_uuid ?? null,
        affidavit_url_host: inner.data?.affidavit_url
          ? safeHost(inner.data.affidavit_url)
          : null,
        data_keys: Object.keys(inner.data ?? {}),
        verification_keys: Object.keys(verification),
        verification_non_null_keys: Object.entries(verification)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k]) => k),
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof WebhookCryptoError ? err.message : 'webhook rejected';
    console.error('[webhook] rejected:', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
