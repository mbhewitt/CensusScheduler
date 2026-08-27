// Pure decision + content logic for the shift-lead nudge. NO db/mail imports so
// it's trivially unit-testable. See shiftLeadNudge.ts for the I/O runner.
//
// noshow semantics (per database/README.md): '' = checked in, 'Yes' = no-show,
// 'X'/NULL = not yet checked in (pending). "checked in" means noshow === ''
// EXACTLY; everything else counts as "not checked in".

const NOT_CHECKED_IN_RATE = 0.3; // >30% of non-leads not checked in fires (B)
const COORDINATOR_EMAIL =
  process.env.NUDGE_COORDINATOR_EMAIL ??
  "censusvolunteercoordinators@burningman.org";
const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "https://volunteers.census.burningman.org";

export { COORDINATOR_EMAIL };

export interface NonLead {
  playaName: string;
  worldName: string;
  checkedIn: boolean;
  reviewed: boolean;
}

export interface ShiftAgg {
  id: number;
  name: string;
  date: string | null;
  time: string; // "HH:MM-HH:MM"
  leadEmails: string[]; // dedup'd, non-empty emails of the shift's leads
  nonLeads: NonLead[];
}

export interface ShiftEval {
  condA: boolean; // someone checked in but not reviewed
  condB: boolean; // >30% of non-leads not checked in
  shouldNudge: boolean;
  unreviewed: NonLead[];
  notCheckedInCount: number;
  total: number;
  pctCheckedIn: number;
}

// checked in = noshow '' only; not checked in = anything else.
export function evaluateShift(agg: ShiftAgg): ShiftEval {
  const total = agg.nonLeads.length;
  const unreviewed = agg.nonLeads.filter((v) => v.checkedIn && !v.reviewed);
  const notCheckedInCount = agg.nonLeads.filter((v) => !v.checkedIn).length;
  const condA = unreviewed.length > 0;
  const notRate = total > 0 ? notCheckedInCount / total : 0;
  const condB = total > 0 && notRate > NOT_CHECKED_IN_RATE;
  const pctCheckedIn = total > 0 ? Math.round((1 - notRate) * 100) : 0;
  return {
    condA,
    condB,
    shouldNudge: condA || condB,
    unreviewed,
    notCheckedInCount,
    total,
    pctCheckedIn,
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Builds the nudge email subject + text/html for a qualifying shift.
export function buildNudgeEmail(agg: ShiftAgg, ev: ShiftEval) {
  const when = `${agg.date ?? ""} ${agg.time}`.trim();
  const link = `${APP_BASE_URL}/shifts/${agg.id}/volunteers`;
  const subject = `Census · Wrap-up needed — ${agg.name} (${when})`;

  const textLines: string[] = [
    `Your shift "${agg.name}" (${when}) ended about an hour ago. While it's fresh:`,
    "",
  ];
  const htmlParts: string[] = [
    `<p>Your shift <strong>${esc(agg.name)}</strong> (${esc(when)}) ended about an hour ago. While it's fresh:</p>`,
  ];

  if (ev.condA) {
    const names = ev.unreviewed.map((v) => `${v.playaName} "${v.worldName}"`);
    textLines.push(
      `${names.length} checked in but not reviewed yet — please add a quick rating/notes:`,
      ...names.map((n) => `  - ${n}`),
      ""
    );
    htmlParts.push(
      `<p><strong>${names.length} checked in but not reviewed yet</strong> — please add a quick rating/notes:</p><ul>${names
        .map((n) => `<li>${esc(n)}</li>`)
        .join("")}</ul>`
    );
  }
  if (ev.condB) {
    const checkedIn = ev.total - ev.notCheckedInCount;
    textLines.push(
      `Only ${ev.pctCheckedIn}% were checked in (${checkedIn} of ${ev.total}). If more people showed up, mark them in.`,
      ""
    );
    htmlParts.push(
      `<p><strong>Only ${ev.pctCheckedIn}% were checked in</strong> (${checkedIn} of ${ev.total}). If more people showed up, mark them in.</p>`
    );
  }

  textLines.push(`Open the shift: ${link}`, "", "Thanks for leading! — BRC Census");
  htmlParts.push(
    `<p><a href="${link}">Open the shift</a></p><p>Thanks for leading!<br/>— BRC Census</p>`
  );

  return { subject, bodyText: textLines.join("\n"), bodyHtml: htmlParts.join("") };
}
