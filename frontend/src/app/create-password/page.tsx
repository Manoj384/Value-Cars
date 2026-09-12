'use client';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/auth';
import { Loader2 } from 'lucide-react';

function CreatePasswordInner() {
  const params = useSearchParams();
  const { openAuth } = useAuth();
  const token = params.get('token') || '';

  useEffect(() => {
    if (token) openAuth({ action: 'create-password', token });
  }, [token, openAuth]);

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-3xl border border-slate-200 p-10 max-w-md">
          <h1 className="text-xl font-black text-slate-900">Invalid link</h1>
          <p className="text-sm text-slate-500 mt-2">
            This activation link is missing its security token. Please open the link from your email again.
          </p>
          <Link href="/" className="mt-6 inline-block px-6 py-2.5 bg-slate-900 hover:bg-rose-600 text-white font-bold rounded-xl transition">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
        <Loader2 className="w-5 h-5 text-rose-600 animate-spin" /> Setting up your account...
      </div>
    </div>
  );
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <CreatePasswordInner />
    </Suspense>
  );
}