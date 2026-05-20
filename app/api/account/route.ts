import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const runtime = 'nodejs';

const Body = z.object({
  linkUuid: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120).optional(),
});

/**
 * Mock account creation. No DB — returns a freshly generated account number
 * and a transaction id (which is just the linkUuid, so /admin/affidavit/[txId]
 * can look up the webhook payload).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  return NextResponse.json({
    accountNumber: 'BB-' + nanoid(8).toUpperCase(),
    routing: '021000021',
    txId: parsed.data.linkUuid,
  });
}
