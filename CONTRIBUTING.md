# Contributing

Thanks for forking this demo — that's exactly what it's here for.

## Editing the guided tour

Every page's sidepanel content lives in `content/docs/*.mdx`. The filename maps to the stop slug:

| File | Stop |
|---|---|
| `01-landing.mdx` | `/` |
| `02-apply.mdx` | `/apply` |
| `03-verify.mdx` | `/verify` |
| `04-verified.mdx` | `/verified` |
| `05-fund.mdx` | `/fund` |
| `06-affidavit.mdx` | `/admin/affidavit/[linkUuid]` |
| `07-compare.mdx` | `/compare` |

Edit them with regular Markdown. The `meta` export at the top of each file controls the title, summary, and "Learn more" links.

## Polyguard positioning

`pnpm lint:positioning` enforces a small set of terminology rules:

- Don't use "detect" or "detection". Polyguard **verifies**, **confirms**, and **prevents**.
- "Privacy First" is two words and capitalized — it's an architectural principle, not an adjective.
- "Digital transactions" — not "digital applications".
- "Fused identity verification" — the deprecated phrasing was "four-factor".
- "Polyguard Mobile" — not "the app" or "Secure Line".

Every doc file must mention at least one of: `Trust Check`, `PG-Presence`, `Privacy First`, `Transaction Affidavit`.

## Re-branding

To fork this for your own neobank:

1. Update the wordmark in `components/Shell.tsx` and the SVG mark in `components/Lattice.tsx`.
2. Change the palette in `app/globals.css`.
3. Rewrite the MDX in `content/docs/` to use your own product voice.
4. Drop your `NEXT_PUBLIC_POLYGUARD_APP_ID` into Vercel and you're live.

## Commit style

We don't enforce a strict commit convention. Imperative subject lines under 70 chars are appreciated.

## Filing issues

Bugs, copy nits, positioning slips, and new tour stops welcome. PRs that touch positioning copy must pass `pnpm lint:positioning`.
