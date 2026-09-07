'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { probeBackend } from '../services/api';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'live' | 'demo'>('checking');

  useEffect(() => {
    let mounted = true;
    probeBackend().then((ok) => {
      if (mounted) setStatus(ok ? 'live' : 'demo');
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'live') {
    return (
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
        <Wifi className="w-3.5 h-3.5" /> Live backend connected
      </div>
    );
  }

  if (status === 'demo') {
    return (
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
        <WifiOff className="w-3.5 h-3.5" /> Showing demo data — start the API server for live data
      </div>
    );
  }

  return null;
}