// The Man burns at 9pm on the Saturday before Labor Day (Labor Day = the first
// Monday of September; BurnSat = Labor Day − 2 days). This countdown always
// targets the NEXT burn — it rolls over to next year's date the moment this
// year's has passed, so it is never negative — and switches from days to hours
// once it's under 48 hours away. Date-agnostic; works every year with no
// hardcoded dates. (Mew 2026-09-11.)

function laborDay(year: number): Date {
  // Sep 1 of `year` (month is 0-indexed → 8), then advance to the first Monday.
  const sep1 = new Date(year, 8, 1);
  const offsetToMonday = (8 - sep1.getDay()) % 7; // getDay: 0=Sun … 6=Sat
  return new Date(year, 8, 1 + offsetToMonday);
}

function burnDateTime(year: number): Date {
  const ld = laborDay(year);
  // BurnSat = Labor Day − 2 days, at 21:00 local time.
  return new Date(ld.getFullYear(), ld.getMonth(), ld.getDate() - 2, 21, 0, 0, 0);
}

// Returns a human countdown to the next Man burn, e.g. "6 days" or "35 hours".
export function manBurnCountdown(now: Date = new Date()): string {
  let burn = burnDateTime(now.getFullYear());
  if (now.getTime() >= burn.getTime()) {
    burn = burnDateTime(now.getFullYear() + 1);
  }
  const ms = burn.getTime() - now.getTime();
  const hours = ms / 3_600_000;
  if (hours < 48) {
    const h = Math.max(0, Math.round(hours));
    return `${h} hour${h === 1 ? "" : "s"}`;
  }
  const days = Math.floor(ms / 86_400_000);
  return `${days} day${days === 1 ? "" : "s"}`;
}

// The line prepended to every outgoing email (see transport.ts).
export const MAN_BURN_MARKER = "The Man burns in";
export function manBurnLineText(now?: Date): string {
  return `\u{1F525} ${MAN_BURN_MARKER} ${manBurnCountdown(now)}.\n\n`;
}
export function manBurnLineHtml(now?: Date): string {
  return `<p style="color:#ea008b;"><b>\u{1F525} ${MAN_BURN_MARKER} ${manBurnCountdown(now)}.</b></p>`;
}
