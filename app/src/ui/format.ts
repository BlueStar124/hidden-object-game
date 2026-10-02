/** 12345 → "12.345" (Vietnamese grouping, without relying on Intl being available). */
export const formatNumber = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Seconds → "03:45" */
export function formatClock(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Seconds → "3m 45s" */
export function formatDuration(secs: number) {
  return `${Math.floor(secs / 60)}m ${Math.floor(secs % 60)}s`;
}
