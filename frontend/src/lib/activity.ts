/**
 * Activity / event tracking. Collector-agnostic: events are buffered in
 * localStorage and flushed via `navigator.sendBeacon` to an optional
 * collector URL. With no collector configured the queue is local-only, so this
 * is safe even when the API server is absent (the intended deploy state).
 *
 * Because the site is a static export, all of this runs purely in the browser.
 */
export interface ActivityEvent {
  ts: number;
  session_id: string;
  path: string;
  target: string;
  action: string;
  props?: Record<string, unknown>;
}

const QUEUE_KEY = 'vc:events';
const QUEUE_MAX = 200;
const COLLECTOR = process.env.NEXT_PUBLIC_EVENTS_URL;

/** One stable anonymous id per browser, minted once into localStorage (no PII). */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'pre-hydration';
  let id = localStorage.getItem('vc:session_id');
  if (!id) {
    id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('vc:session_id', id);
  }
  return id;
}

function readQueue(): ActivityEvent[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(QUEUE_KEY) : null;
    return raw ? (JSON.parse(raw) as ActivityEvent[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(events: ActivityEvent[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-QUEUE_MAX)));
    }
  } catch {
    // ignore
  }
}

/** Record a user action. Safe to call from any event handler. */
export function track(target: string, action: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const event: ActivityEvent = {
    ts: Date.now(),
    session_id: getSessionId(),
    path: window.location.pathname,
    target,
    action,
    props,
  };
  const queue = readQueue();
  queue.push(event);
  writeQueue(queue);
}

/** Send buffered events to the collector (if configured). No-op otherwise. */
export async function flushTracked(): Promise<void> {
  if (typeof window === 'undefined' || !COLLECTOR) return;
  const queue = readQueue();
  if (queue.length === 0) return;

  const body = JSON.stringify({ session_id: queue[queue.length - 1].session_id, events: queue });
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
}