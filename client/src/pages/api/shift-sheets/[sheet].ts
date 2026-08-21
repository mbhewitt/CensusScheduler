import fs from "node:fs/promises";
import path from "node:path";

import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { pool } from "lib/database";
import { withSuperAdmin } from "@/lib/withSuperAdmin";
import { ROLE_BEHAVIORAL_STANDARDS_ID } from "@/constants";
import { drawBusMarker } from "@/utils/pdfMarkers";

// Shift sheets — port of the legacy VCcensus schedPrint pages
// (censusprintsched.php): the paper rosters shift leads carry on playa.
//
//   gate-sampling        one roster page per gate shift (add ?page=2 for the
//                        meal-timing + checklist companion page)
//   airport-sampling     one page per airport/BxB/Decom sampling shift
//   data-entry           one page per data entry shift
//   lab-hosts            one page per Lab Host + Pop Up Lab Host shift
//   daily                one page per day: every simple shift that day with
//                        more than SMALL_MAX_CSP_SLOTS CSP slots (setup,
//                        strike, trainings, big outreach shifts, ...)
//   compact              the rest — shifts staffed by one or two people —
//                        whole burn in one compact list (all positions
//                        appear, unfilled slots print as blank lines)
//   check-in             volunteers grouped by their first shift date,
//                        "initial next to your name" sheets
//
// Positions worth 0 CSP (open party/tour slots) are excluded everywhere.
// Checklist text is carried over from the legacy bm_randomtext table, which
// this app's database does not have.

const PAGE_W = 612;
const PAGE_H = 792;
const M = 28;
const CONTENT_W = PAGE_W - 2 * M;

const BLACK = rgb(0, 0, 0);
const RED = rgb(1, 0, 0);
const GREEN = rgb(0, 0.5, 0);

// op_roles ids without constants.ts entries
const ROLE_RS_TEST_OUT_ID = 1000011; // "Passed online RS-test-out"
const ROLE_RS_TRAINING_COMPLETE_ID = 2000002; // "TrainingRandomSamplingComplete"

// a shift time whose CSP positions total at most this many slots goes on the
// burn-wide Small Shifts page instead of getting day-page rows ("single or
// pair of people per shift" — Mew)
const SMALL_MAX_CSP_SLOTS = 4;

// open slots print as blank sign-up lines, but some positions carry huge
// aspirational slot counts; cap the blanks per position per shift
const MAX_BLANK_ROWS = 20;

// legacy: bm_randomtext version=0 (*Checklist rows), 2025 wording
const CHECKLISTS: Record<string, string[]> = {
  "Gate Sampling": [
    "Verify sufficient supplies",
    "Check out radios",
    "Check volunteers in",
    "Verify all volunteers have Census badges (plus water, sunblock, etc.)",
    "Go over script and forms with volunteers en route",
    "Radio lighthouse at greeters",
    "Radio Gate that samplers will be on the road for 1.5 hours",
    "Turn light towers on (if night shift)",
    "Deploy delineators and signs (if needed)",
    "Calculate interval number",
    "Pass out sampling bags by lane number",
    "Coach volunteers, give breaks and self-care reminders",
    "Assist in organizing data as needed at end of shift",
    "Collect and double label data envelopes",
    "Zero counters after recording counts on labels & page 1",
    "Collect sampling bags (ensuring no completed forms are inside)",
    "Turn off light towers (if night shift)",
    "Radio lighthouse before returning to greeters",
    "Return to Census Lab",
    "Thank your volunteers!",
    "Note volunteer performance on shift roster",
    "Straighten DataBeast for next shift",
    "Return data envelopes, and Shift Lead binder to office",
    "Check in radios",
  ],
  "Airport Sampling": [
    "Verify sufficient supplies",
    "Check out radio",
    "Check volunteers in with tablet",
    "Upon arrival to Airport 'terminal area' introduce the Census team to Airport staff (Say: Slayer knows we are here for surveying at our desks, we'll be here approx. 1.5 hours)",
    "Obtain wristbands, if required (see notes)",
    "Begin sampling",
    "Coach volunteers, give breaks and self-care reminders",
    "End sampling - collect all sampling forms",
    "Double-label data collection envelope",
    "Reorder index cards for the next shift",
    "Zero counter if used after recording counts on roster and envelope",
    "Return to Census Lab",
    "Thank your volunteers!",
    "De-MOOP and unload transport vehicle",
    "Note volunteer performance on shift roster",
    "Return data envelope, sampling bag, and Shift Lead Binder to office",
    "Check in radio",
  ],
  "Data Entry": [
    "Check volunteers in",
    "Explain the four critical rules",
    "Train your wizzes",
    "Initial spot-checks",
    "Self-care reminders",
    "Additional spot-checks",
    "Take notes on Wiz performance",
    "Take notes on any form anomalies",
    "Collect & check completed envelopes",
    "Label and store completed envelopes",
    "Distribute swag and thank volunteers",
  ],
  "Lab Host": [
    "Verify sufficient meal pogs",
    "Verify sufficient supplies & Gather materials in office container or Lockers",
    "TABLET, Stickers, Information resources, Umbrellas, ID stamp",
    "Check out RADIO",
    "Radio Outreach Coordinator.",
    "Check volunteers in",
    "Confirm minimum number of Hosts. (2)",
    "Introductions, Review plan for your shift, Assign roles.",
    "Verify all volunteers have Lab coat, water, sunblock, umbrella, etc.",
    "Give Tour of Lab",
    "Coach volunteers, give breaks, rotate roles and give self-care reminders",
    "3-5PM DATA BASH",
    "5:30PM De-MOOP, Clean-up and Organize Lab",
    "6:00PM Commissary",
    "Thank your volunteers!",
    "Note volunteer performance on roster",
    "Return Shift Lead binder & Tablet(s) to office",
    "Check in radio",
  ],
  "Pop Up Lab Host": [
    "Verify sufficient supplies & Gather materials in DataBeast drawers",
    "TABLET, Stickers, Information resources, Umbrellas, ID Stamp",
    "Check out RADIO",
    "Radio Outreach Coordinator.",
    "Check volunteers in",
    "Confirm minimum number of Hosts (3).",
    "Introductions, Review plan for your shift, Assign roles.",
    "Verify all volunteers have Lab coat, water, sunblock, umbrella, etc.",
    "Assign volunteer to ride with Driver as the spotter & radio communicator",
    "Coach volunteers, give breaks, rotate roles and give self-care reminders",
    "Return to Lab 30min before shift end",
    "De-MOOP",
    "Organize & Store supplies on DataBeast for next shift",
    "Thank your volunteers!",
    "Note volunteer performance on shift roster",
    "Return Shift Lead binder to office",
    "Check in radio",
  ],
};

const SAMPLING_CATEGORIES = [
  "Gate Sampling",
  "Airport Sampling",
  "BxB Sampling",
  "Decom Sampling",
];
// categories with a dedicated sheet; everything else lands on "compact"
const DEDICATED_CATEGORIES = [
  ...SAMPLING_CATEGORIES,
  "Data Entry",
  "Lab Host",
  "Pop Up Lab Host",
];

interface EntryRow extends RowDataPacket {
  shift_times_id: number;
  shift_category: string;
  shift_name: string;
  yr: number;
  datename: string | null;
  ymd: string; // "20260826"
  dow_md: string; // "Wed Aug 26"
  start_time_text: string | null;
  end_time_text: string | null;
  meal: string | null;
  time_position_id: number;
  position_type_id: number;
  position: string;
  is_lead: number;
  slots: number;
  shiftboard_id: number | null;
  playa_name: string | null;
  world_name: string | null;
}

interface Entry {
  position: string;
  positionTypeId: number;
  isLead: boolean;
  isDriver: boolean;
  timePositionId: number;
  slots: number;
  shiftboardId: number | null;
  name: string | null; // null = position row with no signups
  playa: string | null; // playa name alone (lead/driver header lines)
}

interface Sheet {
  id: number;
  category: string;
  name: string;
  yr: number;
  datename: string;
  ymd: string;
  dowMd: string;
  start: string;
  end: string;
  meal: string;
  entries: Entry[];
}

// pdf-lib standard fonts are WinAnsi-only; smart punctuation gets mapped and
// anything else outside latin-1 (emoji in playa names) becomes "?"
const txt = (s: string | null | undefined): string =>
  (s ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\xFF]/g, "?");

// legacy shortname: playa name plus the real name in quotes when they differ
// (censuslib personupdates: compares the first 12 chars), capped at 40 chars
const displayName = (playa: string | null, world: string | null): string => {
  const p = (playa ?? "").trim();
  const w = (world ?? "").trim();
  if (!p) return w;
  const name =
    w && w.slice(0, 12).toLowerCase() !== p.slice(0, 12).toLowerCase()
      ? `${p} "${w}"`
      : p;
  return name.length > 40 ? `${name.slice(0, 20)}${name.slice(-20)}` : name;
};

const toMin = (t: string | null): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? "");
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
};

const fmt12 = (min: number | null): string => {
  if (min === null) return "";
  const h = Math.floor(min / 60) % 24;
  const mm = String(min % 60).padStart(2, "0");
  return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? "AM" : "PM"}`;
};

const to12h = (t: string | null): string => {
  const min = toMin(t);
  return min === null ? "" : fmt12(min).replace(" ", "");
};

const loadSheets = async (
  where: string,
  params: unknown[]
): Promise<Sheet[]> => {
  const [rowList] = await pool.query<EntryRow[]>(
    `SELECT
      st.shift_times_id,
      sc.shift_category,
      sn.shift_name,
      YEAR(d.date) AS yr,
      d.datename,
      DATE_FORMAT(d.date, '%Y%m%d') AS ymd,
      DATE_FORMAT(d.date, '%a %b %e') AS dow_md,
      st.start_time_text,
      st.end_time_text,
      st.meal,
      stp.time_position_id,
      stp.position_type_id,
      COALESCE(NULLIF(stp.position_alias, ''), pt.position) AS position,
      COALESCE(pt.lead, 0) AS is_lead,
      COALESCE(stp.slots, 0) AS slots,
      v.shiftboard_id,
      v.playa_name,
      v.world_name
    FROM op_shift_times AS st
    JOIN op_shift_name AS sn
      ON sn.shift_name_id=st.shift_name_id AND sn.delete_shift=false
    JOIN op_shift_category AS sc
      ON sc.shift_category_id=sn.shift_category_id AND sc.delete_category=false
    JOIN op_dates AS d ON d.date_id=st.start_date_id
    JOIN op_shift_time_position AS stp
      ON stp.shift_times_id=st.shift_times_id AND stp.remove_time_position=false
    JOIN op_position_type AS pt ON pt.position_type_id=stp.position_type_id
    LEFT JOIN op_volunteer_shifts AS vs
      ON vs.time_position_id=stp.time_position_id AND vs.remove_shift=false
    LEFT JOIN op_volunteers AS v
      ON v.shiftboard_id=vs.shiftboard_id AND v.delete_volunteer=false
    WHERE st.remove_shift_time=false
      AND st.canceled=false
      AND COALESCE(stp.sap_points, 0) > 0
      AND ${where}
    ORDER BY d.date, st.start_time_text, st.shift_times_id,
      is_lead DESC, position, v.playa_name`,
    params
  );

  const byShift = new Map<number, Sheet>();
  for (const row of rowList) {
    let sheet = byShift.get(row.shift_times_id);
    if (!sheet) {
      sheet = {
        id: row.shift_times_id,
        category: row.shift_category,
        name: row.shift_name,
        yr: row.yr,
        datename: row.datename ?? "",
        ymd: row.ymd,
        dowMd: row.dow_md,
        start: row.start_time_text ?? "",
        end: row.end_time_text ?? "",
        meal: row.meal ?? "",
        entries: [],
      };
      byShift.set(row.shift_times_id, sheet);
    }
    sheet.entries.push({
      position: row.position,
      positionTypeId: row.position_type_id,
      isLead: row.is_lead === 1,
      isDriver: /driver/i.test(row.position),
      timePositionId: row.time_position_id,
      slots: row.slots,
      shiftboardId: row.shiftboard_id,
      name:
        row.playa_name || row.world_name
          ? displayName(row.playa_name, row.world_name)
          : null,
      playa: (row.playa_name ?? "").trim() || (row.world_name ?? "").trim() || null,
    });
  }
  return [...byShift.values()];
};

// --- gate score (legacy censuslib walk) ----------------------------------
//
// Score = (experience walk + training bonus + recency bonus) x review
// multiplier, ceil'd — the legacy censuslib ~1300-1338 formula. The walk
// covers the legacy 2-year window: history through last year comes
// pre-walked from sampling-history.json (generated from the Shiftboard
// mirror by generate-history.py — this database has no multi-year data);
// the current year's gate signups continue the walk live.

interface ScoreState {
  total: number;
  last: string | null; // "YYYY-MM-DD"
  rv: number;
}

interface GateEvent {
  ymd: string; // "YYYYMMDD"
  w: number;
}

interface ScoreData {
  history: Map<number, ScoreState>;
  events: Map<number, GateEvent[]>; // current-year gate signups, date order
  trained: Set<number>; // holds TrainingRandomSamplingComplete role
}

const gateWeight = (position: string, isLead: boolean): number =>
  isLead ? 2 : /traffic tamer/i.test(position) ? 0.75 : 1;

const daysBetween = (isoOrYmd: string, ymd: string): number => {
  const norm = (s: string) => s.replaceAll("-", "");
  const parse = (s: string) =>
    Date.UTC(+norm(s).slice(0, 4), +norm(s).slice(4, 6) - 1, +norm(s).slice(6, 8));
  return Math.round((parse(ymd) - parse(isoOrYmd)) / 86400000);
};

const loadScoreData = async (): Promise<ScoreData> => {
  const raw = JSON.parse(
    await fs.readFile(
      path.join(process.cwd(), "lib", "shift-sheets", "sampling-history.json"),
      "utf8"
    )
  ) as { volunteers: Record<string, [number, string | null, number]> };
  const history = new Map<number, ScoreState>();
  for (const [sid, [total, last, rv]] of Object.entries(raw.volunteers)) {
    history.set(Number(sid), { total, last, rv });
  }

  const [eventRows] = await pool.query<RowDataPacket[]>(
    `SELECT vs.shiftboard_id, DATE_FORMAT(d.date, '%Y%m%d') AS ymd,
      COALESCE(NULLIF(stp.position_alias, ''), pt.position) AS position,
      COALESCE(pt.lead, 0) AS is_lead
    FROM op_volunteer_shifts AS vs
    JOIN op_shift_time_position AS stp
      ON stp.time_position_id=vs.time_position_id AND stp.remove_time_position=false
    JOIN op_position_type AS pt ON pt.position_type_id=stp.position_type_id
    JOIN op_shift_times AS st
      ON st.shift_times_id=stp.shift_times_id
      AND st.remove_shift_time=false AND st.canceled=false
    JOIN op_shift_name AS sn
      ON sn.shift_name_id=st.shift_name_id AND sn.delete_shift=false
    JOIN op_shift_category AS sc ON sc.shift_category_id=sn.shift_category_id
    JOIN op_dates AS d ON d.date_id=st.start_date_id
    WHERE vs.remove_shift=false AND sc.shift_category = 'Gate Sampling'
    ORDER BY vs.shiftboard_id, d.date`
  );
  const events = new Map<number, GateEvent[]>();
  for (const row of eventRows) {
    if (/driver/i.test(row.position as string)) continue;
    const sid = row.shiftboard_id as number;
    const list = events.get(sid) ?? [];
    list.push({
      ymd: row.ymd as string,
      w: gateWeight(row.position as string, row.is_lead === 1),
    });
    events.set(sid, list);
  }

  const [trainedRows] = await pool.query<RowDataPacket[]>(
    `SELECT shiftboard_id FROM op_volunteer_roles
    WHERE role_id = ? AND remove_role=false`,
    [ROLE_RS_TRAINING_COMPLETE_ID]
  );
  const trained = new Set<number>(
    trainedRows.map((row) => row.shiftboard_id as number)
  );
  return { history, events, trained };
};

// walk this year's events strictly before the sheet date, then apply the
// legacy display bonuses: decay on a stale gap, +2/+1 recency, +2 for a
// completed RS training (role, per Mew — so trainees are never TTo), all
// times the review multiplier
const gateScore = (data: ScoreData, sid: number, sheetYmd: string): number => {
  const hist = data.history.get(sid);
  let total = hist?.total ?? 0;
  let last = hist?.last ?? null;
  for (const ev of data.events.get(sid) ?? []) {
    if (ev.ymd >= sheetYmd) break;
    if (last !== null && daysBetween(last, ev.ymd) > 30) total *= 0.7;
    total += ev.w;
    last = ev.ymd;
  }
  let recency = 0;
  if (last !== null) {
    const gap = daysBetween(last, sheetYmd);
    recency = gap <= 30 ? 2 : 1;
    if (gap > 30) total *= 0.7;
  }
  const trained = data.trained.has(sid);
  const rv = hist?.rv && hist.rv > 0 ? hist.rv : 1;
  return Math.ceil((total + recency + (trained ? 2 : 0)) * rv);
};

interface Marks {
  bs: boolean; // Signed Behavioral Standards
  rs: boolean; // Passed online RS-test-out
  bus?: boolean; // still needs a role-specific training (drawn as a bus)
}

// red pointing finger = Behavioral Standards NOT signed, amber bus = still
// needs a role-specific training, green star = RS test-out passed. On rosters
// the bus is position-specific (missing the training for THAT function); see
// slotRows / loadTrainingReq.
const loadMarks = async (): Promise<Map<number, Marks>> => {
  const [rowList] = await pool.query<RowDataPacket[]>(
    `SELECT
      vr.shiftboard_id,
      MAX(CASE WHEN vr.role_id = ? THEN 1 ELSE 0 END) AS bs,
      MAX(CASE WHEN vr.role_id = ? THEN 1 ELSE 0 END) AS rs
    FROM op_volunteer_roles AS vr
    WHERE vr.remove_role=false
    GROUP BY vr.shiftboard_id`,
    [ROLE_BEHAVIORAL_STANDARDS_ID, ROLE_RS_TEST_OUT_ID]
  );
  const marks = new Map<number, Marks>();
  for (const row of rowList) {
    marks.set(row.shiftboard_id as number, {
      bs: row.bs === 1,
      rs: row.rs === 1,
    });
  }
  return marks;
};

// Role-specific training requirements for the roster bus marker. Mirrors the
// volunteer-info API: a position requires the trainings mapped to its
// position_type, and a volunteer has "completed" a training when they hold its
// role. Returns per-position required training roles and each volunteer's held
// training roles so slotRows can flag, per function, whoever is still missing
// the training for THAT position.
interface TrainingReq {
  posRoles: Map<number, number[]>; // position_type_id -> required training role_ids
  heldByVol: Map<number, Set<number>>; // shiftboard_id -> held training role_ids
}
const loadTrainingReq = async (): Promise<TrainingReq> => {
  const [posRows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT pt.position_type_id, t.role_id
    FROM op_position_trainings AS pt
    JOIN op_trainings AS t ON t.training_id=pt.training_id
    WHERE pt.delete_position_training=false
      AND t.delete_training=false
      AND t.role_id IS NOT NULL`
  );
  const posRoles = new Map<number, number[]>();
  const trainingRoleIds = new Set<number>();
  for (const r of posRows) {
    const roles = posRoles.get(r.position_type_id) ?? [];
    roles.push(r.role_id as number);
    posRoles.set(r.position_type_id as number, roles);
    trainingRoleIds.add(r.role_id as number);
  }

  const heldByVol = new Map<number, Set<number>>();
  if (trainingRoleIds.size > 0) {
    const ids = [...trainingRoleIds];
    const [heldRows] = await pool.query<RowDataPacket[]>(
      `SELECT shiftboard_id, role_id
      FROM op_volunteer_roles
      WHERE remove_role=false
        AND role_id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    for (const r of heldRows) {
      const set = heldByVol.get(r.shiftboard_id) ?? new Set<number>();
      set.add(r.role_id as number);
      heldByVol.set(r.shiftboard_id as number, set);
    }
  }
  return { posRoles, heldByVol };
};

// True when this volunteer is missing any training required for this position.
const needsPositionTraining = (
  train: TrainingReq | undefined,
  positionTypeId: number,
  shiftboardId: number | null
): boolean => {
  if (!train || shiftboardId == null) return false;
  const roles = train.posRoles.get(positionTypeId);
  if (!roles?.length) return false;
  const held = train.heldByVol.get(shiftboardId);
  return roles.some((r) => !held?.has(r));
};

interface Cell {
  t?: string;
  f?: PDFFont;
  s?: number;
  align?: "l" | "c" | "r";
  marks?: Marks; // draws ●/★ markers before the text
}

interface Fonts {
  helv: PDFFont;
  bold: PDFFont;
  ital: PDFFont;
  boldItal: PDFFont;
  zapf: PDFFont;
}

class Pdf {
  doc: PDFDocument;
  fonts: Fonts;
  page!: PDFPage;
  y = 0;

  constructor(doc: PDFDocument, fonts: Fonts) {
    this.doc = doc;
    this.fonts = fonts;
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - M;
  }

  // start a new page unless at least h points remain above the bottom margin
  need(h: number) {
    if (!this.page || this.y - h < M) this.newPage();
  }

  text(
    t: string,
    x: number,
    y: number,
    size = 9,
    font = this.fonts.helv,
    maxW?: number
  ) {
    let out = txt(t);
    if (maxW !== undefined) {
      while (out.length > 1 && font.widthOfTextAtSize(out, size) > maxW) {
        out = out.slice(0, -1);
      }
    }
    this.page.drawText(out, { x, y, size, font, color: BLACK });
  }

  // one bordered table row at the cursor; advances the cursor
  row(colWs: number[], cells: Cell[], rowH: number, border = true, x0 = M) {
    const y = this.y - rowH;
    let cx = x0;
    colWs.forEach((cw, i) => {
      if (border) {
        this.page.drawRectangle({
          x: cx,
          y,
          width: cw,
          height: rowH,
          borderWidth: 0.6,
          borderColor: BLACK,
        });
      }
      const cell = cells[i];
      if (cell?.t || cell?.marks) {
        const f = cell.f ?? this.fonts.helv;
        const s = cell.s ?? 8;
        const ty = y + (rowH - s) / 2 + 1;
        let markW = 0;
        if (cell.marks) {
          let mx = cx + 3;
          if (!cell.marks.bs) {
            this.page.drawText("☛", { x: mx, y: ty, size: s, font: this.fonts.zapf, color: RED });
            mx += this.fonts.zapf.widthOfTextAtSize("☛", s) + 1;
          }
          if (cell.marks.bus) {
            mx += drawBusMarker(this.page, mx, ty, s);
          }
          if (cell.marks.rs) {
            this.page.drawText("★", { x: mx, y: ty, size: s, font: this.fonts.zapf, color: GREEN });
            mx += this.fonts.zapf.widthOfTextAtSize("★", s);
          }
          markW = mx - (cx + 3);
        }
        let clipped = txt(cell.t ?? "");
        while (
          clipped.length > 1 &&
          f.widthOfTextAtSize(clipped, s) > cw - 6 - markW
        ) {
          clipped = clipped.slice(0, -1);
        }
        const tw = f.widthOfTextAtSize(clipped, s);
        const tx =
          cell.align === "c"
            ? cx + (cw - tw) / 2
            : cell.align === "r"
              ? cx + cw - tw - 3
              : cx + 3 + markW + (markW ? 2 : 0);
        this.text(clipped, tx, ty, s, f);
      }
      cx += cw;
    });
    this.y = y;
  }

  // legacy write-in emphasis boxes: a single double-thick border
  thickRect(x: number, y: number, w: number, h: number) {
    this.page.drawRectangle({ x, y, width: w, height: h, borderWidth: 2.6, borderColor: BLACK });
  }

  wrap(t: string, size: number, width: number, font = this.fonts.helv) {
    const words = txt(t).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const probe = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(probe, size) > width && line) {
        lines.push(line);
        line = word;
      } else {
        line = probe;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  footer(note?: string) {
    // legacy sheets carry a "Last updated:" stamp; ours is generation time
    // because the data is read live
    const now = new Date();
    const stamp = `Last updated: ${now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`;
    const w = this.fonts.helv.widthOfTextAtSize(stamp, 7);
    this.text(stamp, PAGE_W - M - w, M - 14, 7);
    if (note) this.text(note, M, M - 14, 7);
  }

  // legacy: "2025 Gate Sampling Shift --- Wed (Aug 20) 11:30 - 15:30 Roster"
  // (24-hour times; we add the datename)
  title(sheet: Sheet, suffix = "Roster") {
    this.text(
      `${sheet.yr} ${sheet.name} Shift --- ${sheet.datename} (${sheet.dowMd}) ${sheet.start} - ${sheet.end}${suffix ? ` ${suffix}` : ""}`,
      M,
      this.y - 14,
      15,
      this.fonts.bold,
      CONTENT_W
    );
    this.y -= 25;
  }

  leadsLine(sheet: Sheet) {
    // legacy gate: "Shift Leads:(names bold) -- Driver: (names bold)" using
    // playa names only, meal right-aligned
    const leads = sheet.entries
      .filter((e) => e.isLead && e.playa)
      .map((e) => e.playa)
      .join(", ");
    const drivers = sheet.entries
      .filter((e) => e.isDriver && e.playa)
      .map((e) => e.playa)
      .join(", ");
    const segs: [string, keyof Fonts][] = [
      ["Shift Leads:(", "helv"],
      [leads || "        ", "bold"],
      [")", "helv"],
    ];
    if (sheet.entries.some((e) => e.isDriver)) {
      segs.push(
        [" -- Driver: (", "helv"],
        [drivers || "        ", "bold"],
        [")", "helv"]
      );
    }
    const mealW = sheet.meal
      ? this.fonts.helv.widthOfTextAtSize(`(${sheet.meal})`, 11) + 10
      : 0;
    const width = (size: number) =>
      segs.reduce(
        (w, [t, f]) => w + this.fonts[f].widthOfTextAtSize(txt(t), size),
        0
      );
    let size = 12;
    while (size > 6.5 && width(size) > CONTENT_W - mealW) size -= 0.5;
    const y = this.y - 10;
    let x = M;
    for (const [t, f] of segs) {
      this.text(t, x, y, size, this.fonts[f]);
      x += this.fonts[f].widthOfTextAtSize(txt(t), size);
    }
    if (sheet.meal) {
      this.text(
        `(${sheet.meal})`,
        PAGE_W - M - mealW + 10,
        y,
        11
      );
    }
    this.y -= 20;
  }

  // legacy checklist style: bordered two-column table, empty check cell +
  // wrapped item text; returns nothing, advances the cursor
  checkTable(x: number, width: number, items: string[], size = 10) {
    const checkW = 26;
    const textW = width - checkW;
    const lineH = size + 2.5;
    for (const item of items) {
      const lines = this.wrap(item, size, textW - 6);
      const rowH = Math.max(lines.length * lineH + 5, 17);
      const y = this.y - rowH;
      this.page.drawRectangle({ x, y, width: checkW, height: rowH, borderWidth: 0.6, borderColor: BLACK });
      this.page.drawRectangle({ x: x + checkW, y, width: textW, height: rowH, borderWidth: 0.6, borderColor: BLACK });
      lines.forEach((line, i) => {
        this.text(line, x + checkW + 3, this.y - 3.5 - (i + 1) * lineH + 2.5, size);
      });
      this.y = y;
    }
  }

  // legacy mealtiming(): estimated timeline for sampling shifts. Offsets in
  // minutes from censusprintsched.php.
  mealTiming(sheet: Sheet, kind: "Gate" | "Airport", x0 = M, scale = 1) {
    const start = toMin(sheet.start);
    const end = toMin(sheet.end);
    if (start === null || end === null) return;
    const before = /before/i.test(sheet.meal);
    // 4th field: which cell gets the legacy double-frame write-in box
    // ("actual" col on Sampling Start; gate also frames Headcount cells)
    const rows: [string, number, boolean, "" | "actual" | "head"][] = [];
    if (kind === "Gate") {
      if (before) {
        rows.push(
          ["Shift Start", start, false, "head"],
          ["Meal End", start + 55, true, "head"],
          ["Sampling Start", start + 105, false, "actual"],
          ["Sampling End", start + 200, true, "head"],
          ["Back at Lab", end, false, ""]
        );
      } else {
        rows.push(
          ["Shift Start", start, false, "head"],
          ["Sampling Start", start + 55, false, "actual"],
          ["Sampling End", start + 150, true, "head"],
          ["Meal End", start + 215, true, "head"],
          ["Back at Lab", end, false, ""]
        );
      }
    } else if (before) {
      rows.push(
        ["Shift Start", start, false, ""],
        ["Meal End", start + 50, true, ""],
        ["Sampling Start", start + 90, false, "actual"],
        ["Sampling End", start + 210, true, ""],
        ["Back at Lab", end, false, ""]
      );
    } else {
      rows.push(
        ["Shift Start", start, false, ""],
        ["Sampling Start", start + 35, false, "actual"],
        ["Sampling End", start + 155, true, ""],
        ["Meal End", start + 220, true, ""],
        ["Back at Lab", end, false, ""]
      );
    }
    const colWs = (kind === "Gate" ? [130, 90, 120, 90] : [130, 90, 120]).map(
      (w) => w * scale
    );
    // legacy meal table is full-size type even in the airport side column:
    // bold-italic meal name, bold Estimate/Actual, bold key times
    const header: Cell[] = [
      { t: sheet.meal || "Meal", f: this.fonts.boldItal, s: 12.5 },
      { t: "Estimate", f: this.fonts.bold, s: 12.5, align: "c" },
      { t: "Actual", f: this.fonts.bold, s: 12.5, align: "c" },
    ];
    if (kind === "Gate") {
      header.push({ t: "Headcount", f: this.fonts.bold, s: 12.5, align: "c" });
    }
    this.row(colWs, header, 19, true, x0);
    for (const [label, min, boldTime, thick] of rows) {
      const cells: Cell[] = [
        { t: label, s: 11.5 },
        {
          t: fmt12(min),
          s: 11.5,
          align: "c",
          f: boldTime ? this.fonts.bold : this.fonts.helv,
        },
        {},
      ];
      if (kind === "Gate") cells.push({});
      this.row(colWs, cells, 19, true, x0);
      if (thick) {
        const col = thick === "actual" ? 2 : 3;
        const cx = x0 + colWs.slice(0, col).reduce((a, b) => a + b, 0);
        this.thickRect(cx, this.y, colWs[col], 19);
      }
    }
  }
}

const openPdf = async (title: string) => {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  const fonts: Fonts = {
    helv: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    ital: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItal: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
    zapf: await doc.embedFont(StandardFonts.ZapfDingbats),
  };
  return new Pdf(doc, fonts);
};

// --- gate sampling -------------------------------------------------------

// legacy: TTo ("traffic tamer only") flags zero-experience volunteers who
// shouldn't be handed a clicker yet
const gateRoleAbbrev = (position: string, score: number) =>
  score === 0 ? "TTo" : /traffic tamer/i.test(position) ? "TT" : "RS";

const gatePage1 = (pdf: Pdf, sheet: Sheet, scoreData: ScoreData) => {
  pdf.newPage();
  pdf.title(sheet);
  pdf.leadsLine(sheet);

  const colWs = [52, 198, 30, 40, 40, 196];
  pdf.row(
    colWs,
    [
      { t: "P-L-C-NS", s: 9 },
      { t: "Name", s: 9 },
      { t: "" },
      { t: "Score", s: 9 },
      { t: "Lane #", s: 9 },
      { t: "Met/Exceeded Expectations and Other Notes", s: 9 },
    ],
    16
  );
  const samplers = sheet.entries
    .filter((e) => e.name && !e.isLead && !e.isDriver)
    .map((e) => ({
      ...e,
      score: gateScore(scoreData, e.shiftboardId ?? -1, sheet.ymd),
    }))
    .sort((a, b) => b.score - a.score);
  // pad to the legacy 31 rows; a fuller shift prints everyone by shrinking
  // the rows instead of dropping names (pdf-lib has no auto page break)
  const rowCount = Math.max(31, samplers.length);
  const rowH = Math.min(16.8, (31 * 16.8) / rowCount);
  for (let i = 0; i < rowCount; i++) {
    const e = samplers[i];
    const s = rowH < 12 ? 7.5 : 10;
    pdf.row(
      colWs,
      [
        { t: String(i + 1), s: 8 },
        { t: e?.name ?? "", s },
        { t: e ? gateRoleAbbrev(e.position, e.score) : "", s: 9, align: "c" },
        { t: e ? String(e.score) : "", f: pdf.fonts.bold, s: 13, align: "c" },
        {},
        {},
      ],
      rowH
    );
  }
  pdf.y -= 10;

  // bottom left: estimates (legacy hardcodes minsamp=10, interval=2);
  // bottom right: per-lane clicker tally grid
  const blockTop = pdf.y;
  const estWs = [100, 46];
  pdf.row(estWs, [{ t: "Estimated Lanes", s: 9 }, { t: "5", f: pdf.fonts.bold, s: 13, align: "c" }], 19);
  pdf.row(estWs, [{ t: "Estimated Int#", s: 9 }, { t: "2", f: pdf.fonts.bold, s: 13, align: "c" }], 19);
  {
    const boxW = estWs[0] + estWs[1];
    pdf.thickRect(M, pdf.y - 48, boxW, 48);
    for (const [i, line] of ["Actual Interval#", "(1-5) / (6-10)"].entries()) {
      const lw = pdf.fonts.helv.widthOfTextAtSize(line, 9.5);
      pdf.text(line, M + (boxW - lw) / 2, pdf.y - 13 - i * 11.5, 9.5);
    }
    pdf.y -= 48;
  }

  const laneX = M + 180;
  const laneW = 33;
  let y = blockTop;
  const laneCols = ["Lane", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "6-10"];
  let cx = laneX;
  for (const label of laneCols) {
    pdf.page.drawRectangle({ x: cx, y: y - 18, width: laneW, height: 18, borderWidth: 0.6, borderColor: BLACK });
    const size = label.length > 4 ? 8 : 12;
    const tw = pdf.fonts.helv.widthOfTextAtSize(label, size);
    pdf.text(label, cx + (laneW - tw) / 2, y - 14.5, size);
    cx += laneW;
  }
  y -= 18;
  {
    const clickH = 34;
    pdf.page.drawRectangle({ x: laneX, y: y - clickH, width: laneW, height: clickH, borderWidth: 0.6, borderColor: BLACK });
    pdf.text("Click", laneX + 3, y - 13, 9);
    cx = laneX + laneW;
    for (let i = 1; i < laneCols.length; i++) {
      pdf.thickRect(cx, y - clickH, laneW, clickH);
      cx += laneW;
    }
    y -= clickH;
  }
  pdf.footer("Score = sampling experience (2-yr walk x reviews); TTo = no experience");
};

const gatePage2 = (pdf: Pdf, sheet: Sheet) => {
  pdf.newPage();
  pdf.title(sheet, "");
  pdf.y -= 4;
  pdf.mealTiming(sheet, "Gate");
  pdf.y -= 16;

  const half = CONTENT_W / 2;
  const top = pdf.y;
  pdf.text("Checklist(check when complete):", M, pdf.y - 14, 14, pdf.fonts.bold);
  pdf.y -= 20;
  pdf.checkTable(M, half, CHECKLISTS["Gate Sampling"], 10);
  pdf.text("Notes:", M + half + 10, top - 12, 11, pdf.fonts.bold);
  pdf.footer();
};

// --- airport / data entry / lab host style pages -------------------------

const rosterPage = (pdf: Pdf, sheet: Sheet) => {
  pdf.newPage();
  pdf.title(sheet);

  // legacy: "----Shift Lead: Names----Driver(Name)" italic label
  const leads = sheet.entries
    .filter((e) => e.isLead && e.playa)
    .map((e) => e.playa)
    .join(", ");
  const driver = sheet.entries.find((e) => e.isDriver && e.playa)?.playa;
  const y = pdf.y - 11;
  let x = M;
  const seg = (t: string, font: PDFFont, size = 11) => {
    pdf.text(t, x, y, size, font);
    x += font.widthOfTextAtSize(txt(t), size);
  };
  seg("----", pdf.fonts.helv);
  seg("Shift Lead: ", pdf.fonts.ital);
  seg(leads || "        ", pdf.fonts.helv);
  seg("----", pdf.fonts.helv);
  if (driver) seg(`Driver(${driver})`, pdf.fonts.helv);
  pdf.y -= 20;

  const colWs = [52, 210, 294];
  pdf.row(
    colWs,
    [
      { t: "P-L-C-NS", s: 9 },
      { t: "Name", s: 9 },
      { t: "Met/Exceeded Expectations and Other Notes", s: 9 },
    ],
    16
  );
  const workers = sheet.entries.filter(
    (e) => e.name && !e.isLead && !e.isDriver
  );
  // pad to the legacy 11 rows; a fuller shift prints everyone by shrinking
  // the rows so the checklist below still fits on the page
  const rowCount = Math.max(11, workers.length);
  const rowH = Math.min(21, (11 * 21) / rowCount);
  for (let i = 0; i < rowCount; i++) {
    pdf.row(
      colWs,
      [
        { t: String(i + 1), s: 8 },
        { t: workers[i]?.name ?? "", s: rowH < 12 ? 7.5 : 10 },
        {},
      ],
      rowH
    );
  }
  pdf.y -= 12;

  const isAirport = SAMPLING_CATEGORIES.includes(sheet.category);
  const isDataEntry = sheet.category === "Data Entry";
  const half = CONTENT_W * 0.47;
  const rightX = M + half + 14;
  const rightW = CONTENT_W - half - 14;
  const top = pdf.y;

  pdf.text("Checklist(check when complete):", M, pdf.y - 14, 14, pdf.fonts.bold);
  pdf.y -= 20;
  const checklist =
    CHECKLISTS[sheet.category] ?? CHECKLISTS["Airport Sampling"];
  pdf.checkTable(M, half, checklist);
  const checklistBottom = pdf.y;

  // right column
  pdf.y = top;
  if (isAirport) {
    // clicker / interval / plane-count capture boxes, then meal timeline
    const boxW = (CONTENT_W - half - 14) / 2;
    let cx = rightX;
    for (const label of ["Clicker #", "Interval #"]) {
      pdf.thickRect(cx, pdf.y - 46, boxW - 6, 46);
      const lw = pdf.fonts.helv.widthOfTextAtSize(label, 10);
      pdf.text(label, cx + (boxW - 6 - lw) / 2, pdf.y - 14, 10);
      cx += boxW;
    }
    pdf.y -= 52;
    {
      const lw = pdf.fonts.helv.widthOfTextAtSize("# of Planes", 10);
      pdf.page.drawRectangle({ x: rightX, y: pdf.y - 26, width: boxW - 6, height: 26, borderWidth: 0.8, borderColor: BLACK });
      pdf.text("# of Planes", rightX + (boxW - 6 - lw) / 2, pdf.y - 16, 10);
      pdf.page.drawRectangle({ x: rightX + boxW, y: pdf.y - 26, width: boxW - 6, height: 26, borderWidth: 0.8, borderColor: BLACK });
    }
    pdf.y -= 34;
    pdf.mealTiming(sheet, "Airport", rightX, 0.82);
  } else {
    // legacy: a bordered capture box beside the checklist with the prompt
    // in its top-left corner
    const prompt = isDataEntry
      ? "Pouches completed on this shift:"
      : "Questions, comments, or suggestions for future:";
    const boxH = top - checklistBottom;
    pdf.page.drawRectangle({
      x: rightX,
      y: top - boxH,
      width: rightW,
      height: boxH,
      borderWidth: 0.6,
      borderColor: BLACK,
    });
    pdf.text(prompt, rightX + 4, top - 12, 8, pdf.fonts.helv, rightW - 8);
  }

  pdf.y = Math.min(checklistBottom, pdf.y) - 10;
  const bottomPrompt = isDataEntry
    ? "Data Anomalies, questions, comments, or suggestions for future:"
    : isAirport
      ? "Interactions with Airport Personnel (briefly describe the interaction and with whom), questions, comments, or suggestions for future:"
      : ""; // lab hosts capture questions in the box beside the checklist
  for (const line of pdf.wrap(bottomPrompt, 9.5, CONTENT_W)) {
    pdf.text(line, M, pdf.y - 11, 9.5);
    pdf.y -= 12;
  }
  pdf.footer();
};

// --- daily / small / check-in --------------------------------------------

interface SlotRow {
  position: string;
  name: string;
  marks?: Marks;
}

// rows for one shift: filled entries first, then a blank line per open slot
// (capped — some positions carry huge aspirational slot counts)
const slotRows = (
  sheet: Sheet,
  marks: Map<number, Marks>,
  train?: TrainingReq
): SlotRow[] => {
  const byPosition = new Map<
    number,
    { position: string; slots: number; filled: SlotRow[] }
  >();
  for (const e of sheet.entries) {
    let g = byPosition.get(e.timePositionId);
    if (!g) {
      g = { position: e.position, slots: e.slots, filled: [] };
      byPosition.set(e.timePositionId, g);
    }
    if (e.name) {
      const base = marks.get(e.shiftboardId ?? -1) ?? { bs: false, rs: false };
      g.filled.push({
        position: e.position,
        name: e.name,
        // roster bus is position-specific: missing the training for THIS function
        marks: {
          ...base,
          bus: needsPositionTraining(train, e.positionTypeId, e.shiftboardId),
        },
      });
    }
  }
  const rows: SlotRow[] = [];
  for (const g of byPosition.values()) {
    rows.push(...g.filled);
    const blanks = Math.min(
      Math.max(g.slots - g.filled.length, 0),
      MAX_BLANK_ROWS
    );
    for (let i = 0; i < blanks; i++) {
      rows.push({ position: g.position, name: "" });
    }
    const dropped = g.slots - g.filled.length - blanks;
    if (dropped > 0) {
      rows.push({ position: g.position, name: `... +${dropped} more open slots` });
    }
  }
  return rows;
};

// total CSP slots on a shift decides small-vs-daily ("single or pair of
// people per shift" goes on the burn-wide page)
const cspSlots = (sheet: Sheet): number => {
  const seen = new Map<number, number>();
  for (const e of sheet.entries) seen.set(e.timePositionId, e.slots);
  return [...seen.values()].reduce((a, b) => a + b, 0);
};

// one page per day; every simple shift that day gets its own table
// (legacy conDecon layout, position column added)
const dailySheets = (
  pdf: Pdf,
  sheets: Sheet[],
  marks: Map<number, Marks>,
  train?: TrainingReq
) => {
  const byDay = new Map<string, Sheet[]>();
  for (const sheet of sheets) {
    const list = byDay.get(sheet.ymd) ?? [];
    list.push(sheet);
    byDay.set(sheet.ymd, list);
  }
  const colWs = [165, 245, 146];
  for (const dayList of byDay.values()) {
    pdf.newPage();
    const first = dayList[0];
    pdf.text(
      `Census ${first.yr} - ${first.datename} (${first.dowMd}) Roster`,
      M,
      pdf.y - 14,
      15,
      pdf.fonts.bold
    );
    pdf.y -= 27;
    for (const sheet of dayList) {
      const time = `${sheet.start} - ${sheet.end}`;
      pdf.need(60);
      // full-width shift title bar, then position/name/notes rows
      pdf.row(
        [CONTENT_W],
        [{ t: `${sheet.name}   ${time}`, f: pdf.fonts.bold, s: 11 }],
        20
      );
      pdf.row(
        colWs,
        [
          { t: "Position", f: pdf.fonts.bold, s: 9, align: "c" },
          { t: "Name", f: pdf.fonts.bold, s: 9, align: "c" },
          { t: "Notes", f: pdf.fonts.bold, s: 9, align: "c" },
        ],
        15
      );
      for (const r of slotRows(sheet, marks, train)) {
        const before = pdf.page;
        pdf.need(18);
        if (pdf.page !== before) {
          // continue the shift's table on the new page with its headers
          pdf.row(
            [CONTENT_W],
            [{ t: `${sheet.name}   ${time} (cont.)`, f: pdf.fonts.bold, s: 11 }],
            20
          );
        }
        pdf.row(
          colWs,
          [{ t: r.position, s: 9 }, { t: r.name, s: 10, marks: r.marks }, {}],
          19.5
        );
      }
      pdf.y -= 16;
    }
    pdf.footer();
  }
};

const smallSheets = (
  pdf: Pdf,
  sheets: Sheet[],
  marks: Map<number, Marks>,
  train?: TrainingReq
) => {
  pdf.newPage();
  const yr = sheets[0]?.yr ?? new Date().getFullYear();
  pdf.text(`Census ${yr} Small Shift Rosters`, M, pdf.y - 14, 15, pdf.fonts.bold);
  pdf.y -= 27;
  // one table per category, one row per person/slot — the compact format
  const colWs = [102, 96, 122, 152, 84];
  const header: Cell[] = [
    { t: "Date", f: pdf.fonts.bold, align: "c" },
    { t: "Time", f: pdf.fonts.bold, align: "c" },
    { t: "Position", f: pdf.fonts.bold, align: "c" },
    { t: "Name", f: pdf.fonts.bold, align: "c" },
    { t: "Notes", f: pdf.fonts.bold, align: "c" },
  ];
  let lastCategory = "";
  const ordered = [...sheets].sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.ymd.localeCompare(b.ymd) ||
      a.start.localeCompare(b.start)
  );
  for (const sheet of ordered) {
    const rows = slotRows(sheet, marks, train);
    if (!rows.length) continue;
    if (sheet.category !== lastCategory) {
      lastCategory = sheet.category;
      pdf.need(70);
      pdf.y -= 9;
      pdf.text(sheet.category, M, pdf.y - 12, 12, pdf.fonts.bold);
      pdf.y -= 16;
      pdf.row(colWs, header, 15);
    }
    const time = `${sheet.start} - ${sheet.end}`;
    for (const r of rows) {
      const before = pdf.page;
      pdf.need(17.5);
      if (pdf.page !== before) pdf.row(colWs, header, 15); // continue table
      pdf.row(
        colWs,
        [
          { t: `${sheet.datename} ${sheet.dowMd.slice(4)}`, s: 9 },
          { t: time, s: 8.5 },
          { t: r.position, s: 9 },
          { t: r.name, s: 10, marks: r.marks },
          {},
        ],
        17.5
      );
    }
  }
  pdf.footer("All CSP-earning positions; blank line = open slot");
};

interface CheckInRow extends RowDataPacket {
  shiftboard_id: number;
  playa_name: string | null;
  world_name: string | null;
  dow_md: string;
  datename: string | null;
}

const checkInSheets = async (pdf: Pdf, marks: Map<number, Marks>) => {
  const [rowList] = await pool.query<CheckInRow[]>(
    `SELECT
      v.shiftboard_id,
      v.playa_name,
      v.world_name,
      DATE_FORMAT(fs.first_date, '%a %b %e') AS dow_md,
      d.datename
    FROM (
      SELECT vs.shiftboard_id, MIN(d.date) AS first_date
      FROM op_volunteer_shifts AS vs
      JOIN op_shift_time_position AS stp
        ON stp.time_position_id=vs.time_position_id
        AND stp.remove_time_position=false
        AND COALESCE(stp.sap_points, 0) > 0
      JOIN op_shift_times AS st
        ON st.shift_times_id=stp.shift_times_id
        AND st.remove_shift_time=false AND st.canceled=false
      JOIN op_shift_name AS sn
        ON sn.shift_name_id=st.shift_name_id AND sn.delete_shift=false
      JOIN op_dates AS d ON d.date_id=st.start_date_id
      WHERE vs.remove_shift=false
      GROUP BY vs.shiftboard_id
    ) AS fs
    JOIN op_volunteers AS v
      ON v.shiftboard_id=fs.shiftboard_id AND v.delete_volunteer=false
    LEFT JOIN op_dates AS d ON d.date=fs.first_date AND d.delete_date=false
    ORDER BY fs.first_date, v.world_name, v.playa_name`
  );

  const byDay = new Map<string, CheckInRow[]>();
  for (const row of rowList) {
    const key = `${row.datename ?? ""} (${row.dow_md})`;
    const list = byDay.get(key) ?? [];
    list.push(row);
    byDay.set(key, list);
  }
  const colWs = [74, 246, 236];
  for (const [day, people] of byDay) {
    for (let start = 0; start < people.length; start += 30) {
      pdf.newPage();
      const pageNum = Math.floor(start / 30) + 1;
      const pages = Math.ceil(people.length / 30);
      pdf.text(
        `First Census Shift on ${day}${pages > 1 ? ` - Page ${pageNum}` : ""}`,
        M,
        pdf.y - 14,
        15,
        pdf.fonts.bold
      );
      pdf.y -= 23;
      pdf.text("Please initial next to your name", M, pdf.y - 10, 10, pdf.fonts.ital);
      pdf.y -= 18;
      pdf.row(
        colWs,
        [
          { t: "Initial", f: pdf.fonts.bold, s: 9, align: "c" },
          { t: "Name", f: pdf.fonts.bold, s: 9, align: "c" },
          { t: "Notes", f: pdf.fonts.bold, s: 9, align: "c" },
        ],
        16
      );
      for (const person of people.slice(start, start + 30)) {
        pdf.row(
          colWs,
          [
            {},
            {
              t: displayName(person.playa_name, person.world_name),
              s: 10,
              marks: marks.get(person.shiftboard_id) ?? { bs: false, rs: false },
            },
            {},
          ],
          20
        );
      }
      pdf.footer();
    }
  }
  if (byDay.size === 0) pdf.newPage();
};

// --- handler -------------------------------------------------------------

const shiftSheets = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }
  const sheet = String(req.query.sheet ?? "");

  let pdf: Pdf;
  let filename: string;

  switch (sheet) {
    case "gate-sampling": {
      const page2 = req.query.page === "2";
      pdf = await openPdf(page2 ? "Gate Sampling p2" : "Gate Sampling");
      const sheets = await loadSheets("sc.shift_category = ?", ["Gate Sampling"]);
      const scoreData = page2 ? null : await loadScoreData();
      for (const s of sheets) {
        if (page2) gatePage2(pdf, s);
        else gatePage1(pdf, s, scoreData as ScoreData);
      }
      if (!sheets.length) pdf.newPage();
      filename = page2 ? "GateSampling_p2.pdf" : "GateSampling.pdf";
      break;
    }
    case "airport-sampling": {
      pdf = await openPdf("Airport Sampling");
      const sheets = await loadSheets("sc.shift_category IN (?)", [
        SAMPLING_CATEGORIES.filter((c) => c !== "Gate Sampling"),
      ]);
      for (const s of sheets) rosterPage(pdf, s);
      if (!sheets.length) pdf.newPage();
      filename = "AirportSampling.pdf";
      break;
    }
    case "data-entry": {
      pdf = await openPdf("Data Entry");
      const sheets = await loadSheets("sc.shift_category = ?", ["Data Entry"]);
      for (const s of sheets) rosterPage(pdf, s);
      if (!sheets.length) pdf.newPage();
      filename = "DataEntry.pdf";
      break;
    }
    case "lab-hosts": {
      pdf = await openPdf("Lab Hosts");
      const sheets = await loadSheets("sc.shift_category IN (?)", [
        ["Lab Host", "Pop Up Lab Host"],
      ]);
      for (const s of sheets) rosterPage(pdf, s);
      if (!sheets.length) pdf.newPage();
      filename = "LabHosts.pdf";
      break;
    }
    // daily and small split the same pool of non-dedicated shifts by size:
    // a shift with more than SMALL_MAX_CSP_SLOTS CSP slots earns day-page
    // rows; the rest go on the burn-wide Small Shifts page
    case "daily": {
      pdf = await openPdf("Daily Rosters");
      const sheets = await loadSheets("sc.shift_category NOT IN (?)", [
        DEDICATED_CATEGORIES,
      ]);
      dailySheets(
        pdf,
        sheets.filter((s) => cspSlots(s) > SMALL_MAX_CSP_SLOTS),
        await loadMarks(),
        await loadTrainingReq()
      );
      if (!pdf.page) pdf.newPage();
      filename = "DailyRosters.pdf";
      break;
    }
    case "compact": {
      pdf = await openPdf("Small Shifts");
      const sheets = await loadSheets("sc.shift_category NOT IN (?)", [
        DEDICATED_CATEGORIES,
      ]);
      smallSheets(
        pdf,
        sheets.filter((s) => cspSlots(s) <= SMALL_MAX_CSP_SLOTS),
        await loadMarks(),
        await loadTrainingReq()
      );
      filename = "SmallShifts.pdf";
      break;
    }
    case "check-in": {
      pdf = await openPdf("Check-In");
      await checkInSheets(pdf, await loadMarks());
      filename = "CheckIn.pdf";
      break;
    }
    default:
      return res.status(404).json({ statusCode: 404, message: "Unknown sheet" });
  }

  const bytes = await pdf.doc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  return res.send(Buffer.from(bytes));
};

export default withSuperAdmin(shiftSheets);
