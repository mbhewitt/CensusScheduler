// Backoff schedule (seconds), indexed by attempt count (1-based).
// Caps at 24h and stays there forever. Rationale (#307):
// on-playa internet can be out for days, so we never give up on a
// transient failure — only permanent SMTP errors mark the row `dead`.
const BACKOFF_SECONDS = [60, 300, 900, 3_600, 21_600, 86_400] as const;

export function nextAttemptDelaySeconds(attempts: number): number {
  if (attempts < 1) return BACKOFF_SECONDS[0];
  const idx = Math.min(attempts - 1, BACKOFF_SECONDS.length - 1);
  return BACKOFF_SECONDS[idx];
}
