/**
 * Error logging. Normalizes + dedupes errors, buffers them in localStorage,
 * and flushes to an optional collector or browser-only Sentry. Fully
 * client-side (works with the static export / no backend).
 */
import { getSessionId } from './activity';

export interface ReportedError {
  ts: number;
  session_id: string;
  path: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

const QUEUE_KEY = 'vc:errors';
const QUEUE_MAX = 60;
const COLLECTOR = process.env.NEXT_PUBLIC_ERRORS_URL;
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

function readQueue(): ReportedError[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(QUEUE_KEY) : null;
    return raw ? (JSON.parse(raw) as ReportedError[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(errors: ReportedError[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(errors.slice(-QUEUE_MAX)));
    }
  } catch {
    // ignore
  }
}

function normalize(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (typeof err === 'string') return { message: err };
  let message = 'Unknown error';
  try {
    message = JSON.stringify(err);
  } catch {
    // non-serializable value
  }
  return { message };
}

/**
 * Record a caught/uncaught error with optional context. Dedupes rapid
 * bursts of identical errors (same message + path within 2s).
 */
export function reportError(err: unknown, context?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const { message, stack } = normalize(err);
  const entry: ReportedError = {
    ts: Date.now(),
    session_id: getSessionId(),
    path: window.location.pathname,
    message,
    stack,
    context,
  };

  const queue = readQueue();
  const last = queue[queue.length - 1];
  const isDuplicateBurst =
    last &&
    last.message === entry.message &&
    last.path === entry.path &&
    Date.now() - last.ts < 2000;

  if (!isDuplicateBurst) {
    queue.push(entry);
    writeQueue(queue);
  }

  // Keep DevTools useful in dev, but avoid noise in production.
  if (process.env.NODE_ENV !== 'production') console.error(err);
}

/** Flush buffered errors to Sentry and/or a generic collector. */
export async function flushErrors(): Promise<void> {
  if (typeof window === 'undefined') return;
  const queue = readQueue();
  if (queue.length === 0) return;

  // 1) Browser-only Sentry capture when a DSN is configured.
  const win = window as unknown as { Sentry?: { captureException: (e: Error, opts?: unknown) => void } };
  if (SENTRY_DSN && win.Sentry) {
    queue.forEach((e) => {
      win.Sentry!.captureException(new Error(e.message), {
        extra: { context: e.context, path: e.path, session_id: e.session_id },
      });
    });
  }

  // 2) Generic collector via sendBeacon.
  if (COLLECTOR) {
    const body = JSON.stringify({ session_id: queue[queue.length - 1].session_id, errors: queue });
    let sent = false;
    try {
      if (navigator.sendBeacon) {
        sent = navigator.sendBeacon(COLLECTOR, new Blob([body], { type: 'application/json' }));
      }
      if (!sent) {
        await fetch(COLLECTOR, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        });
        sent = true;
      }
    } catch {
      sent = false;
    }
    if (sent) writeQueue([]);
    return;
  }

  // 3) No collector: local-only queue (kept for later export/debug).
}