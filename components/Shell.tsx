import Link from 'next/link';
import { Lattice } from './Lattice';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-charcoal/10 bg-beige-light/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" data-tap>
            <Lattice className="h-6 w-6 text-charcoal group-hover:text-sage-strong transition-colors" />
            <span className="font-serif text-lg tracking-tight">Beige Bank</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3 text-sm">
            <Link
              href="/compare"
              className="px-3 py-2 rounded-md hover:bg-beige-dark transition-colors text-charcoal-soft hover:text-charcoal"
              data-tap
            >
              Why Beige
            </Link>
            <Link href="/apply" className="btn-primary text-xs px-3 py-2" data-tap>
              Open account
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-charcoal/10 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-xs text-charcoal-soft flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center justify-between">
          <p>
            This is a demonstration only. Beige Bank is fictional. The
            integration is real — powered by{' '}
            <a
              href="https://polyguard.ai"
              className="underline hover:text-charcoal"
              target="_blank"
              rel="noreferrer"
            >
              Polyguard
            </a>
            .
          </p>
          <a
            href="https://github.com/polyguard-ai/demo-neobank-origination"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-charcoal"
          >
            Fork on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
