'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { installGlobalHandlers } from '../lib/analytics';
import { track } from '../lib/activity';

/**
 * Client-only bootstrap that installs global crash handlers + periodic
 * activity/error flush, and emits a route-view event on every navigation.
 * Rendered once in the root layout (renders nothing).
 */
export function AppTelemetry() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    installGlobalHandlers();
  }, []);

  // Activity: emit a generic page-view per route transition (deduped to avoid
  // double-firing the same pathname, e.g. React StrictMode re-runs).
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track('route', 'view', { path: pathname });
  }, [pathname]);

  return null;
}