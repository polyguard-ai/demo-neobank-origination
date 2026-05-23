# CLAUDE.md

This file orients agents (Claude Code and others) to this repo. Read it before touching code so you don't re-discover patterns the hard way.

## What this is

Beige Bank is a fictional neobank used as an **end-to-end demo of Polyguard** for account origination. It is open source and meant to be forked. It runs on Next.js 15 App Router + React 19 + Tailwind v4, deployed on Vercel.

The point isn't the bank — it's the integration: how a real client app drives the Polyguard browser SDK, handles the encrypted webhook, gates state on cryptographic proofs, and produces a court-admissible Transaction Affidavit.

## Companion repo

The Polyguard browser SDK source lives in `polyguard-ai/web-sdk`. If you're working in a session that has both repos checked out, **read the SDK source for ground truth** on `client.verify()` behavior — the public docs lag the code. Key facts you'll want to know:

- `verify(target, rawJwt)` — `target` is a DOM element id. Embedded mode.
- `verify()` with no target — SDK appends its own full-screen modal to `document.body`. Cancel rejects with `new Error('User cancelled')`. Server errors don't reject; they resolve with `{ presence: { score: 'OFFLINE', msg } }`.
- The SDK is published two ways: ESM (`@polyguard/sdk`) and IIFE (`https://cdn.polyguard.ai/sdk/latest/sdk.js`). This demo depends on the ESM npm package and dynamic-imports it at runtime — see `lib/load-polyguard.ts`. The CDN IIFE is still available for forkers who'd rather drop in a `<script>` tag.

## High-level architecture

```
┌──────────────┐  1. SDK QR / deeplink  ┌────────────────────┐
│  Beige Bank  │ ─────────────────────▶ │  Polyguard Mobile  │
│  (browser)   │                        │  on user's phone   │
└──────────────┘                        └────────────────────┘
       │                                          │
       │  2. JWT + presence (SDK promise)         │  3. Trust Check
       │ ◀────────────────────────────────────────┘     completes
       │
       │  4. poll /api/status/[linkUuid]
       │
┌──────▼────────┐    5. POST /api/webhook    ┌──────────────────┐
│  Next.js API  │  ◀──────────────────────── │ Polyguard backend│
│  (Vercel)     │   AES-256-GCM envelope     │                  │
└───────────────┘                            └──────────────────┘
       │
       │  6. decrypt + store by link_uuid (Upstash Redis)
       │  7. /api/status/[linkUuid] returns the full payload
```

**The webhook is the source of truth.** The SDK return is for UX only — Beige Bank never authorizes a money movement on the SDK's word.

## Two SDK rendering styles, on purpose

The demo shows both because customers ask about both:

| Page | Style | Why |
|---|---|---|
| `/verify` | Embedded into `#pg-qr-target` | The page IS the check — keeping it inline reads as "this is what your customer sees." |
| `/fund` | SDK-built modal (no target) | A re-verification on top of an existing form is a secondary action; a modal overlay preserves the funding context underneath. |

The shared imperative call is `lib/run-polyguard-verify.ts → runPolyguardVerify({ mode, target })`. Pass a `target` for embedded, omit it for modal. The function resolves with a `VerificationSnapshot` ready to drop into `useAppStore.setVerification`.

## State management — read this before touching the store

Zustand + `persist` middleware (`lib/state.ts`). Storage is `localStorage` under `beige-bank-demo`. Persisted keys: `applicant`, `verification`, `account`, `docsCollapsed`.

### The hydration race (most common bug)

`persist` rehydrates asynchronously. The first client render sees defaults, **not** localStorage values. If you write:

```tsx
const verification = useAppStore(s => s.verification);
useEffect(() => { if (!verification) router.replace('/verify'); }, [verification]);
```

…the effect fires before hydration completes and bounces every deep-link to `/verify`. Always gate on hydration:

```tsx
const hasHydrated = useHasHydrated();
const verification = useAppStore(s => s.verification);
useEffect(() => {
  if (hasHydrated && !verification) router.replace('/verify');
}, [hasHydrated, verification, router]);
if (!hasHydrated) return null;
```

`useHasHydrated` is wired via `onRehydrateStorage` in the store config.

### Resetting

The `Reset` button (Shell header) calls `useAppStore.reset()` and routes to `/verify`. Don't add per-page reset logic — one entry point.

## Webhook polling lives in the layout, on purpose

`components/WebhookEnrichment.tsx` is mounted in `app/(origination)/layout.tsx` so the poll survives `<PolyguardVerify>` unmounting on navigation. Anywhere you call `runPolyguardVerify`, set the resulting snapshot on the store — the layout-level poller picks it up automatically. Don't add a second polling loop inside a page.

## Progress bar and step gating

`components/ProgressBar.tsx` is the navigation. Things to know:

- The flow is exactly 5 steps: `verify → verified → apply → fund → affidavit`. The landing (`/`) and compare (`/compare`) pages live OUTSIDE the progress bar — they set `showProgress={false}` in `PageWithDocs`.
- Each step has a completion predicate (verification present, applicant email saved, account created). Steps render as disabled `<span aria-disabled>` with a lock icon until their predecessor is complete. Do NOT add a path that lets users skip ahead — the gating is the demo of "you can't fake your way down the funnel."
- The Affidavit step's href is computed: `/admin/affidavit/{linkUuid}` once verification exists, else `#`.

## Tour docs

MDX files in `content/docs/*.mdx`, loaded by `components/DocsPanelLoader.tsx` based on the page's `slug`. Each meta has `stepNumber` (1–5 for in-flow pages, omitted for landing and compare). If you add a flow step, update the numbers — they're displayed in the docs panel.

Every MDX file must mention at least one of: `Trust Check`, `PG-Presence`, `Privacy First`, `Transaction Affidavit`. Enforced by `pnpm lint:positioning`.

## Positioning lint

`lib/positioning-lint.ts` rejects deprecated wording. The biggest gotcha: **never write "detect" or "detection"** — Polyguard verifies, confirms, prevents. We sell certainty, not signals. Other forbidden terms: `privacy-first` (use `Privacy First`), `digital application` (use `digital transactions`), `four-factor` (use `fused identity verification`), `Secure Line` (use `Polyguard Mobile`).

Run `pnpm lint:positioning` before pushing. CI runs it too.

## Required proofs

Two canonical proof lists in `lib/polyguard.ts`:

- `REQUIRED_PROOFS_FOR_KYC` — full onboarding: name + pg_presence + pg_attestation_key_id + pg_region.
- `REQUIRED_PROOFS_FOR_REVERIFY` — funding step: same four proofs. The reverify intentionally re-binds to the original identity (not just liveness), which is the entire point of "continuous verification."

If you add a third flavor, give it a constant name and document why. Don't pass a literal array inline.

## API routes

- `POST /api/webhook` — receives the AES-256-GCM envelope from Polyguard, decrypts, stores by `link_uuid` in Upstash Redis. See `lib/webhook-crypto.ts` for the envelope shape.
- `GET /api/status/[linkUuid]` — returns the stored payload. The browser polls this after `verify()` resolves.
- `POST /api/account` — mock account creation, returns `{ accountNumber, routing, txId }`. No real bank backend.
- `GET /admin/affidavit/[linkUuid]` — renders the signed Transaction Affidavit via the presigned URL the webhook delivers.

The webhook secret (`POLYGUARD_WEBHOOK_SECRET`) is **server only**. Never import it from a client component.

## Responsive patterns

- Tailwind `md` (768px) and `lg` (1024px) breakpoints.
- `useIsMobile()` / `useBreakpoint()` in `lib/use-is-mobile.ts`. Both return false during SSR — treat that as "desktop" and let it correct on first effect.
- The DocsPanel uses three modes: mobile sheet, tablet drawer, desktop rail. The mobile sheet auto-opens once on first visit (controlled by `docsCollapsed`); persist behavior is intentional.

## Common gotchas

- **Do not** create a new modal component for a Polyguard check. The SDK has one. Pass `target: undefined` and let it own the overlay.
- **Do not** mount `WebhookEnrichment` inside a page — it must live in the layout to survive navigation.
- **Do not** add CSS that races the SDK for `#pg-qr-target`. Set wrapper size; let the injected SVG fill it (`[&>svg]:w-full`). On mobile, don't set fixed dimensions on the wrapper — the SDK injects a button.
- **Do not** treat the SDK return as authoritative for money movement. Wait for the webhook event in `verification.event === 'trust_check.completed'`.
- **Do not** include the Welcome or Compare pages in `STOPS` in `ProgressBar.tsx` — they're outside the funnel by design.
- **Do not** create documentation files unless asked. (This file was asked for.)

## Commands

```bash
pnpm dev               # Next.js dev server
pnpm build             # Production build
pnpm typecheck         # tsc --noEmit
pnpm lint              # eslint
pnpm lint:positioning  # the positioning rules above
```

There is no test suite — visual verification via a running dev server is the convention here.
