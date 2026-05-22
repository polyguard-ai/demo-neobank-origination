# Beige Bank — Polyguard origination demo

An open-source, end-to-end demo of how [Polyguard](https://polyguard.ai) prevents fraud during neobank account origination. Built in Next.js 15 (App Router), deployed on Vercel.

**Live demo:** _[https://notabank.dev](https://notabank.dev/)_

**What it shows**
- A real Polyguard Trust Check at signup — not a mockup.
- The webhook flow: AES-256-GCM-encrypted server-to-server delivery, decrypted and stored ephemerally.
- Continuous verification: a second, faster Trust Check before the first wire.
- A Transaction Affidavit view that opens the signed PDF via presigned URL.
- A guided documentation sidepanel on every step — collapsible, mobile-first.

**What it is not**
- Production-ready. No DB. No retries. No multi-user auth.

---

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpolyguard-ai%2Fdemo-neobank-origination&env=NEXT_PUBLIC_POLYGUARD_APP_ID,NEXT_PUBLIC_POLYGUARD_API_SERVER,POLYGUARD_WEBHOOK_SECRET,POLYGUARD_AFFIDAVIT_HOST_ALLOWLIST)

After deploying, point the webhook URL in your Polyguard app dashboard at `https://<your-deployment>.vercel.app/api/webhook`.

---

## Quick start (local)

```bash
pnpm install
cp .env.example .env.local
# Fill in your Polyguard sandbox app id + webhook secret
pnpm dev
```

Then, in a separate terminal, expose your dev server so Polyguard can post webhooks to it:

```bash
ngrok http 3000
# Paste the https URL into your Polyguard app's webhook config
```

Open http://localhost:3000 and start the flow at "Open my account".

---

## Architecture

```
┌──────────────┐  1. SDK QR/deeplink   ┌────────────────────┐
│  Beige Bank  │ ────────────────────▶ │  Polyguard Mobile  │
│   (browser)  │                       │  on user's phone   │
└──────────────┘                       └────────────────────┘
       │                                          │
       │  2. JWT + presence (SDK promise)         │  3. Trust Check
       │ ◀────────────────────────────────────────┘     completes
       │
       │  4. poll /api/status/:linkUuid
       │
┌──────▼────────┐    5. POST /api/webhook    ┌──────────────────┐
│  Next.js API  │  ◀──────────────────────── │ Polyguard backend│
│  (Vercel)     │   AES-256-GCM envelope     │                  │
└───────────────┘                            └──────────────────┘
       │
       │  6. decrypt + store in-memory by link_uuid
       │  7. /api/status/:linkUuid returns full webhook payload
       │
┌──────▼──────────┐
│ /verified, /fund │
│ /admin/affidavit │
└──────────────────┘
```

The **webhook is the source of truth** — Beige Bank never parses or trusts the JWT for authorization decisions.

---

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_POLYGUARD_APP_ID` | Browser + server | Your Polyguard sandbox app id. Browser-exposed (not secret). |
| `NEXT_PUBLIC_POLYGUARD_API_SERVER` | Browser + server | Defaults to `api.polyguard.ai`. |
| `NEXT_PUBLIC_POLYGUARD_SDK_URL` | Browser | Overrides the SDK CDN URL. Defaults to `https://cdn.polyguard.ai/sdk/latest/sdk.js`. |
| `POLYGUARD_WEBHOOK_SECRET` | **Server only** | 32-byte base64 AES-256-GCM key from the Polyguard app dashboard. |
| `POLYGUARD_AFFIDAVIT_HOST_ALLOWLIST` | Server | Comma-separated host allow-list for the affidavit presigned URL. |
| `UPSTASH_REDIS_REST_URL` | **Server only** | Upstash Redis REST URL. Required on Vercel — see "Why Upstash" below. |
| `UPSTASH_REDIS_REST_TOKEN` | **Server only** | Upstash Redis REST token. |

See `.env.example` for working defaults.

---

## Scripts

```bash
pnpm dev               # Next.js dev server
pnpm build             # Production build
pnpm start             # Production server
pnpm typecheck         # tsc --noEmit
pnpm lint              # next lint
pnpm lint:positioning  # Enforces Polyguard terminology (e.g. no "detect")
pnpm format            # Prettier
```

---

## Why Upstash Redis?

The `/api/webhook` handler and the `/api/status` + `/admin/affidavit` routes are **separate serverless functions on Vercel** — they cannot share a module-scoped in-memory `Map`. The Polyguard webhook would land in one function's memory and be invisible to every other route. We use Upstash Redis (free tier) as a tiny bridge: webhook writes, other routes read. Provision takes 60 seconds at [console.upstash.com](https://console.upstash.com); paste the REST URL and token into Vercel.

If you skip Upstash, the demo falls back to a per-function in-memory `Map`. That's fine for `next dev` (one process), but on Vercel the affidavit view will silently fail to surface webhook data.

## Productionizing this demo

This repo is deliberately minimal. Before shipping anything like this to real customers:

- **Persistence.** Upstash Redis is sized for a demo (30-minute TTL, no replication). Real workloads want a tamper-evident store (DynamoDB, Postgres with row-level integrity, append-only audit log).
- **IDOR.** `/api/status/:linkUuid` is unauthenticated — the link UUID is opaque but anyone with it can read the webhook. Production should require a session or signed cookie tying the requesting user to the link.
- **SSRF / open redirect.** The `affidavit_url` host allow-list in `lib/affidavit-url.ts` is the only defense against a hostile webhook signer. Keep it tight; review it when Polyguard adds new storage backends.
- **Webhook idempotency.** `setPayload` is naive last-write-wins. For real workloads, dedupe by `(link_uuid, timestamp)` and emit your own deterministic outbox event.
- **Replay window.** The 5-minute window in `lib/webhook-crypto.ts` matches Polyguard's defaults but should be auditable in your own SIEM.

---

## Repo layout

- `app/` — App Router pages, including `(origination)` group and `admin/affidavit/[linkUuid]`
- `app/api/` — `webhook`, `status/[linkUuid]`, `account` route handlers
- `components/` — Shell, DocsPanel, PolyguardVerify, ProgressBar, …
- `content/docs/` — One MDX file per tour stop. Edit these to re-skin the docs sidepanel.
- `lib/` — Webhook crypto, store, allow-list, polyguard config, Zustand state, positioning lint
- `.github/workflows/ci.yml` — Typecheck + lint + positioning lint + build

---

## License

MIT. See [LICENSE](./LICENSE).
