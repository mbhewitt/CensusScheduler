// Pure SAP (Setup Access Pass) date/pool logic. No DB, no I/O — unit-tested in
// tests/unit/sap.test.ts. DB-backed wrappers live in lib/sapDb.ts.

// Burn year: Burning Man's SAP cycle runs Oct 1 (y-1) .. Sep 30 (y). A date in
// Jan-Sep belongs to its own calendar year; Oct-Dec rolls forward to year+1.
// Input is "YYYY-MM-DD" (mysql2 dateStrings mode).
export function burnYear(isoDate: string): number {
  const [y, m] = isoDate.split("-").map(Number);
  return m >= 10 ? y + 1 : y;
}

// The current event's burn year = the most common burn year across op_dates.
// op_dates is normally a single event, so this just picks that year while
// tolerating stray rows (e.g. a Training date in a different month). Ties break
// to the later year. Returns null for an empty table.
export function modeBurnYear(isoDates: string[]): number | null {
  const counts = new Map<number, number>();
  for (const d of isoDates) {
    const by = burnYear(d);
    counts.set(by, (counts.get(by) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = -1;
  for (const [by, c] of counts) {
    if (c > bestCount || (c === bestCount && best !== null && by > best)) {
      best = by;
      bestCount = c;
    }
  }
  return best;
}

// One calendar day earlier, as "YYYY-MM-DD" (UTC-stable, no TZ drift).
export function subtractOneDayISO(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

// The day a volunteer's SAP should be dated: the day BEFORE their first
// CSP-bearing shift, giving them setup time. Null when they have no qualifying
// shift (handled upstream).
export function autoTargetDay(firstCspShiftDate: string | null): string | null {
  return firstCspShiftDate ? subtractOneDayISO(firstCspShiftDate) : null;
}

// Auto pick from a pool: the SAP whose date is the LATEST one <= targetDay.
// That's the target day itself when in stock, else the closest earlier day — an
// earlier-dated SAP is always valid ("valid on or after"). Preferring the
// closest earlier day preserves scarce early SAPs. Returns null when targetDay
// is null or only later-dated SAPs remain (the row then needs a manual choice).
export function pickAutoSap<T extends { sapDate: string }>(
  targetDay: string | null,
  availableSaps: readonly T[],
): T | null {
  if (!targetDay) return null;
  let best: T | null = null;
  for (const s of availableSaps) {
    if (s.sapDate <= targetDay && (best === null || s.sapDate > best.sapDate)) {
      best = s;
    }
  }
  return best;
}
