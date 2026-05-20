import type { MDXComponents } from 'mdx/types';
import { CodeBlock } from '@/components/CodeBlock';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="font-serif text-2xl text-charcoal mb-3 mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-serif text-xl text-charcoal mt-6 mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-sans text-base font-semibold text-charcoal mt-4 mb-1">{children}</h3>
    ),
    p: ({ children }) => <p className="text-charcoal/85 leading-relaxed mb-3">{children}</p>,
    ul: ({ children }) => (
      <ul className="list-disc pl-5 space-y-1 mb-3 text-charcoal/85">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-5 space-y-1 mb-3 text-charcoal/85">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="text-charcoal font-semibold">{children}</strong>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-sage-strong underline underline-offset-2 hover:text-sage transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-sage pl-4 italic text-charcoal/75 my-4">
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      const lang = className?.replace('language-', '');
      if (!lang) {
        return (
          <code className="bg-beige-dark px-1.5 py-0.5 rounded text-[0.9em] font-mono text-charcoal">
            {children}
          </code>
        );
      }
      return <CodeBlock code={String(children).trim()} lang={lang} />;
    },
    pre: ({ children }) => <>{children}</>,
    ...components,
  };
}
