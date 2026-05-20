'use client';
import { POLYGUARD_SDK_URL, type PolyguardClientConstructor } from './polyguard';

let cached: Promise<PolyguardClientConstructor> | null = null;

/**
 * Idempotently loads the Polyguard IIFE bundle from the public CDN and
 * resolves with the `window.Polyguard.Client` constructor.
 */
export function loadPolyguardClient(): Promise<PolyguardClientConstructor> {
  if (cached) return cached;
  cached = new Promise<PolyguardClientConstructor>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Polyguard SDK can only be loaded in the browser.'));
      return;
    }
    if (window.Polyguard?.Client) {
      resolve(window.Polyguard.Client);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-polyguard-sdk]`,
    );
    const finish = () => {
      if (window.Polyguard?.Client) resolve(window.Polyguard.Client);
      else reject(new Error('Polyguard SDK loaded but window.Polyguard.Client is missing.'));
    };
    if (existing) {
      if (existing.dataset.loaded === 'true') return finish();
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Polyguard SDK script failed to load.')),
        { once: true },
      );
      return;
    }
    const script = document.createElement('script');
    script.src = POLYGUARD_SDK_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.polyguardSdk = '';
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      finish();
    }, { once: true });
    script.addEventListener(
      'error',
      () => {
        cached = null;
        reject(new Error('Polyguard SDK script failed to load.'));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
  return cached;
}
