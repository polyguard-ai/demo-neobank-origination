'use client';
import { useEffect, useState } from 'react';

/**
 * Tailwind `md` breakpoint = 768px.
 * Returns true for viewport < 768px, false otherwise.
 * Always returns false during SSR — the consumer should treat that as "desktop"
 * and the value updates on first effect.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 768) setBp('mobile');
      else if (w < 1024) setBp('tablet');
      else setBp('desktop');
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return bp;
}
