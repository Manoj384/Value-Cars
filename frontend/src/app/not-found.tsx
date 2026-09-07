import Link from 'next/link';
import { SearchX, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-slate-900">Page not found</h1>
      <p className="text-slate-500 mt-2 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
      >
        <Home className="w-4 h-4 mr-2" /> Back to the marketplace
      </Link>
    </div>
  );
}