'use client';
import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { clsx } from 'clsx';

export function CodeBlock({
  code,
  lang = 'tsx',
  className,
}: {
  code: string;
  lang?: string;
  className?: string;
}) {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    codeToHtml(code, {
      lang,
      theme: 'github-light',
    }).then((rendered) => {
      if (!cancelled) setHtml(rendered);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={clsx('relative group my-3 rounded-md border border-charcoal/10 bg-white/60 text-[0.85em] overflow-hidden', className)}>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 text-[0.7rem] uppercase tracking-wider px-2 py-1 rounded bg-charcoal/85 text-beige-light opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy code"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      {html ? (
        <div
          className="overflow-x-auto p-3 [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:font-mono"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 font-mono whitespace-pre">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
