import { api } from './api';

/**
 * Aggregated, fire-and-forget usage metrics. Events are buffered in memory and flushed
 * in batches (debounced, and on page hide). Failures are silently ignored — metrics are
 * never required for copy/download to work.
 */
type EventType = 'copy' | 'download';
const buffer = new Map<string, number>();
let timer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_DELAY = 5000;

export function trackEvent(stickerId: string, type: EventType) {
  const key = `${stickerId}|${type}`;
  buffer.set(key, Math.min((buffer.get(key) ?? 0) + 1, 50));
  if (!timer) timer = setTimeout(flushMetrics, FLUSH_DELAY);
}

export function pendingEvents() {
  return Array.from(buffer.entries()).map(([key, count]) => {
    const [sticker_id, type] = key.split('|') as [string, EventType];
    return { sticker_id, type, count };
  });
}

export function flushMetrics() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const events = pendingEvents().slice(0, 100);
  if (!events.length) return;
  buffer.clear();
  api.sendEvents(events).catch(() => {
    /* ignore */
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushMetrics();
  });
}
