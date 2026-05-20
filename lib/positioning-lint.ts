#!/usr/bin/env tsx
/**
 * Polyguard positioning lint.
 * Scans app/, components/, and content/ for forbidden terminology.
 * Run via `pnpm lint:positioning`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

type Rule = { pattern: RegExp; message: string };

const ROOT = resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'content'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.md', '.mdx', '.css']);

const FORBIDDEN: Rule[] = [
  {
    pattern: /\bdetect(ion|s|ing|ed)?\b/gi,
    message:
      "Avoid 'detect/detection' — Polyguard verifies, confirms, and prevents. We sell certainty, not signals.",
  },
  {
    pattern: /\bprivacy-first\b/g,
    message: "Use 'Privacy First' (two words, capitalized) — it's an architectural principle.",
  },
  {
    pattern: /\bdigital applications?\b/gi,
    message: "Use 'digital transactions' — not 'digital applications'.",
  },
  {
    pattern: /\bfour[- ]factor\b/gi,
    message:
      "Use 'fused identity verification' — 'four-factor' is the deprecated framing.",
  },
  {
    pattern: /\bSecure Line\b/g,
    message: "Use 'Polyguard Mobile' — not 'Secure Line'.",
  },
];

const REQUIRED_PER_DOC: RegExp[] = [
  /Trust Check/,
  /PG-Presence/,
  /Privacy First/,
  /Transaction Affidavit/,
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(full.slice(full.lastIndexOf('.')))) files.push(full);
  }
  return files;
}

const errors: string[] = [];

for (const sub of SCAN_DIRS) {
  const dir = join(ROOT, sub);
  let files: string[];
  try {
    files = walk(dir);
  } catch {
    continue;
  }
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const rule of FORBIDDEN) {
      const matches = content.match(rule.pattern);
      if (matches) {
        errors.push(
          `${relative(ROOT, file)} — ${rule.message} (found: ${[...new Set(matches)].join(', ')})`,
        );
      }
    }
  }
}

// Each MDX doc file must mention at least one Polyguard-canonical term.
const docsDir = join(ROOT, 'content', 'docs');
try {
  for (const file of readdirSync(docsDir).filter((f) => f.endsWith('.mdx'))) {
    const content = readFileSync(join(docsDir, file), 'utf8');
    if (!REQUIRED_PER_DOC.some((r) => r.test(content))) {
      errors.push(
        `content/docs/${file} — must mention at least one of: Trust Check, PG-Presence, Privacy First, Transaction Affidavit.`,
      );
    }
  }
} catch {
  /* no docs yet */
}

if (errors.length) {
  console.error('Positioning lint failed:\n');
  for (const e of errors) console.error('  • ' + e);
  console.error(`\n${errors.length} issue(s).`);
  process.exit(1);
}
console.log('Positioning lint passed.');
