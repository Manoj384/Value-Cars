'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Floating "scroll to top" button that appears after scrolling down.
 * Improves navigation on long, mobile-scrollable pages.
 */
export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/30 hover:bg-rose-600 flex items-center justify-center transition transform hover:-translate-y-1"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};