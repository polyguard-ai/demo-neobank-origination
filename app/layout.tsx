import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Beige Bank — Open an account in 5 minutes',
  description:
    'A fictional neobank built to show how Polyguard prevents fraud during account origination. Open source on GitHub.',
  openGraph: {
    title: 'Beige Bank — A Polyguard fraud-prevention demo',
    description:
      'Open an account in 5 minutes. Verified, not just checked. See how Polyguard turns identity into evidence.',
    url: 'https://demo-neobank-origination.vercel.app',
    siteName: 'Beige Bank',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E8DFD2',
  viewportFit: 'cover',
};

const PRE_HYDRATION_SCRIPT = `
(function(){
  try {
    var raw = localStorage.getItem('beige-bank-demo');
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var collapsed = parsed && parsed.state && parsed.state.docsCollapsed;
    if (collapsed) document.documentElement.dataset.docsCollapsed = 'true';
  } catch(_) {}
})();
`.trim();

const PLAUSIBLE_INIT_SCRIPT = `
window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_HYDRATION_SCRIPT }} />
        {/* Privacy-friendly analytics by Plausible */}
        <script
          async
          src="https://plausible.io/js/pa-zqFP9sFzCVUS-QeI3GUXu.js"
        />
        <script dangerouslySetInnerHTML={{ __html: PLAUSIBLE_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
