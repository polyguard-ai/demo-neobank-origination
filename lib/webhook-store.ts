import type { WebhookInner } from './webhook-crypto';

/**
 * Module-scoped in-memory store for received webhook payloads.
 * Keyed by `link_uuid`. Acceptable for a demo; the README explains the
 * cold-start behavior under "Productionizing this demo".
 */
const store = new Map<string, WebhookInner>();
const MAX_ENTRIES = 200;

export function setPayload(payload: WebhookInner): void {
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value;
    if (firstKey) store.delete(firstKey);
  }
  store.set(payload.link_uuid, payload);
}

export function getPayload(linkUuid: string): WebhookInner | undefined {
  return store.get(linkUuid);
}

export function hasPayload(linkUuid: string): boolean {
  return store.has(linkUuid);
}
