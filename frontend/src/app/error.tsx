'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-slate-900">Something went wrong</h1>
      <p className="text-slate-500 mt-2 max-w-md">
        We encountered an unexpected error while loading this page. Please try again, or head
        back to the marketplace.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
        >
          <Home className="w-4 h-4 mr-2" /> Back to home
        </Link>
      </div>
    </div>
  );
}