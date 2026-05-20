import { Redis } from '@upstash/redis';
import type { WebhookInner } from './webhook-crypto';

/**
 * Webhook payload store.
 *
 * Production (Vercel): backed by Upstash Redis. The Polyguard webhook
 * arrives in one serverless function (/api/webhook) and the affidavit page
 * + status endpoint render in *different* serverless functions, so a
 * module-scoped in-process Map is invisible across them. Redis is the
 * smallest store that fixes that.
 *
 * Local development / CI: if the Upstash env vars are absent we fall back
 * to a module-scoped Map, which works fine because `next dev` runs one
 * Node process and `next build` doesn't store any webhooks.
 *
 * Required env vars (production only):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const TTL_SECONDS = 60 * 30; // 30 minutes — long enough for a demo, short
// enough that abandoned sessions don't accumulate.
const KEY_PREFIX = 'beige-bank:webhook:';

const redis: Redis | null =
  REDIS_URL && REDIS_TOKEN
    ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
    : null;

const memoryStore = new Map<string, WebhookInner>();
const MAX_MEMORY_ENTRIES = 200;

export async function setPayload(payload: WebhookInner): Promise<void> {
  if (redis) {
    await redis.set(KEY_PREFIX + payload.link_uuid, payload, { ex: TTL_SECONDS });
    return;
  }
  if (memoryStore.size >= MAX_MEMORY_ENTRIES) {
    const firstKey = memoryStore.keys().next().value;
    if (firstKey) memoryStore.delete(firstKey);
  }
  memoryStore.set(payload.link_uuid, payload);
}

export async function getPayload(linkUuid: string): Promise<WebhookInner | undefined> {
  if (redis) {
    const payload = await redis.get<WebhookInner>(KEY_PREFIX + linkUuid);
    return payload ?? undefined;
  }
  return memoryStore.get(linkUuid);
}

export function isUsingRedis(): boolean {
  return redis !== null;
}
