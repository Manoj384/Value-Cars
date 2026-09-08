/**
 * Analytics/telemetry bootstrap. Installs global crash handlers and periodic
 * flush of buffered events/errors. Called once from a client component in the
 * root layout. Safe to be a no-op when not in a browser.
 */
import { reportError, flushErrors } from './errorReporting';
import { flushTracked } from './activity';

let installed = false;

export function installGlobalHandlers(): void {
  if (typeof window === 'undefined' || installed) return;
  installed = true;

  // Crash handlers (Pillar 2 / Pillar 4): capture anything that throws
  // outside of a component boundary or is rejected without being caught.
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      type: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { type: 'unhandledrejection' });
  });

  // Flush buffered activity/errors when the tab hides or closes, plus a soft
  // periodic flush while open so data doesn't sit unshipped for long.
  const flush = () => {
    void flushTracked();
    void flushErrors();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
  window.setInterval(flush, 60_000);
}