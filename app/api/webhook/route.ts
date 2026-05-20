import { NextResponse } from 'next/server';
import { decryptWebhook, WebhookCryptoError, type WebhookEnvelope } from '@/lib/webhook-crypto';
import { setPayload } from '@/lib/webhook-store';

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
    setPayload(inner);
    console.log(
      '[webhook] stored payload',
      JSON.stringify({
        event: inner.event,
        link_uuid: inner.link_uuid,
        has_affidavit: !!inner.data?.affidavit_url,
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof WebhookCryptoError ? err.message : 'webhook rejected';
    console.error('[webhook] rejected:', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
