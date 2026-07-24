import fs from "node:fs/promises";
import path from "node:path";

import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";

import { pool } from "lib/database";
import { withSuperAdmin } from "@/lib/withSuperAdmin";

// Sampling bag labels — dynamic port of the "Census Labels <year>" mail-merge
// template (example output: Census 2022 Sampling Bag Labels). One 2"x4" label
// per bag on Avery 5163/5523 stock (10-up, 2 cols x 5 rows on Letter):
//
//   - Gate Sampling: one full page per shift — lanes 1-5, two labels per lane
//   - Airport Sampling + BxB Sampling: two labels per shift (lane left blank),
//     flowing 10-up; the last page is padded with generic "<year> BxB" spares
//     (the 2022 sheet did the same)
//
// Header/date/time text and font sizes come from the template's merge fields
// (Type / Month / Day / Shift / Lane); the census-wheel logo is the template's
// embedded image.

const PAGE_W = 612;
const PAGE_H = 792;
const LABEL_W = 288; // 4in
const LABEL_H = 144; // 2in
const COL_EDGE = [11.25, 312.75];
const ROW_TOP0 = PAGE_H - 36;
const TEXT_INSET = 12;

const BLACK = rgb(0, 0, 0);

interface ShiftRow extends RowDataPacket {
  kind: string; // Gate | Airport | BxB
  md: string; // "8/26"
  yr: number;
  datename: string | null;
  start_time_text: string | null;
  end_time_text: string | null;
}

interface BagLabel {
  header: string; // "2026 Gate PreWed"
  dateline: string; // "8/26 11:30AM-3:30PM"
  lane: string; // "1".."5" or ""
}

// "15:30" -> "3:30PM" (template style, e.g. "11:30AM-03:30PM" — the 2022
// sheet's padding was inconsistent hand-merged data; we render unpadded)
const to12h = (t: string | null): string => {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? "");
  if (!m) return "";
  const h = parseInt(m[1], 10);
  return `${((h + 11) % 12) + 1}:${m[2]}${h < 12 ? "AM" : "PM"}`;
};

const timeRange = (start: string | null, end: string | null): string => {
  const s = to12h(start);
  const e = to12h(end);
  return s && e ? `${s}-${e}` : s || e;
};

const sampling = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }

  const [shiftList] = await pool.query<ShiftRow[]>(
    `SELECT
      SUBSTRING_INDEX(sc.shift_category, ' ', 1) AS kind,
      DATE_FORMAT(d.date, '%c/%e') AS md,
      YEAR(d.date) AS yr,
      d.datename,
      st.start_time_text,
      st.end_time_text
    FROM op_shift_times AS st
    JOIN op_shift_name AS sn
      ON sn.shift_name_id=st.shift_name_id AND sn.delete_shift=false
    JOIN op_shift_category AS sc ON sc.shift_category_id=sn.shift_category_id
    LEFT JOIN op_dates AS d ON d.date_id=st.start_date_id
    WHERE sc.shift_category IN ('Gate Sampling', 'Airport Sampling', 'BxB Sampling')
      AND st.remove_shift_time=false
      AND st.canceled=false
      AND sn.shift_name NOT LIKE '%Training%'
      AND sn.shift_name NOT LIKE '%Videographer%'
    ORDER BY
      FIELD(sc.shift_category, 'Gate Sampling', 'Airport Sampling', 'BxB Sampling'),
      d.date, st.start_time_text`
  );

  const year =
    shiftList.find((row) => row.yr)?.yr ?? new Date().getFullYear();

  // "OpenSun1st"/"OpenSun2nd" when a kind has several shifts the same day
  // (template's Type field style)
  const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];
  const dayCount = new Map<string, number>();
  for (const row of shiftList) {
    const key = `${row.kind}|${row.md}`;
    dayCount.set(key, (dayCount.get(key) ?? 0) + 1);
  }
  const daySeen = new Map<string, number>();
  const typed = shiftList.map((row) => {
    const key = `${row.kind}|${row.md}`;
    const seq = daySeen.get(key) ?? 0;
    daySeen.set(key, seq + 1);
    const suffix = (dayCount.get(key) ?? 1) > 1 ? (ORDINALS[seq] ?? `${seq + 1}th`) : "";
    return {
      kind: row.kind,
      header: `${year}  ${row.kind} ${row.datename ?? ""}${suffix}`,
      dateline: `${row.md} ${timeRange(row.start_time_text, row.end_time_text)}`.trim(),
    };
  });

  const doc = await PDFDocument.create();
  doc.setTitle(`Census ${year} Sampling Bag Labels`);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvItal = await doc.embedFont(StandardFonts.HelveticaOblique);
  const logoBytes = await fs.readFile(
    path.join(process.cwd(), "lib", "labels", "census-wheel.png")
  );
  const logo = await doc.embedPng(logoBytes);

  let page: PDFPage | null = null;
  let slot = 0; // 0..9, row-major (2 per row)
  const nextSlot = (): { x: number; top: number } => {
    if (slot % 10 === 0) {
      page = doc.addPage([PAGE_W, PAGE_H]);
    }
    const s = slot % 10;
    slot += 1;
    return {
      x: COL_EDGE[s % 2],
      top: ROW_TOP0 - Math.floor(s / 2) * LABEL_H,
    };
  };

  // template metrics (points from label top / left edge); sizes from the
  // docx: header 12 bold, date line 12 italic, clicker+lane 14, notes 8
  const drawLabel = (label: BagLabel) => {
    const { x, top } = nextSlot();
    const p = page as PDFPage;
    const tx = x + TEXT_INSET;
    const draw = (
      text: string,
      dx: number,
      dy: number,
      size: number,
      font: PDFFont
    ) => p.drawText(text, { x: tx + dx, y: top - dy, size, font, color: BLACK });

    draw(label.header, 0, 20, 12, helvBold);
    if (label.dateline) draw(label.dateline, 0, 35, 12, helvItal);
    draw("__________<-Clicker", 0, 72, 14, helv);
    draw(`Lane: ${label.lane}`, 0, 98, 14, helv);
    draw("Notes:", 92, 98, 8, helv);
    // census wheel, right side (template: ~1.71 x 1.68 in), vertically centered
    const w = 123;
    const h = (logo.height / logo.width) * w;
    p.drawImage(logo, {
      x: x + LABEL_W - w - 8,
      y: top - (LABEL_H + h) / 2,
      width: w,
      height: h,
    });
  };

  // gate: a full page per shift, lanes 1-5 x 2 labels
  for (const shift of typed.filter((t) => t.kind === "Gate")) {
    slot = Math.ceil(slot / 10) * 10; // start each gate shift on a fresh page
    for (let lane = 1; lane <= 5; lane++) {
      for (let copy = 0; copy < 2; copy++) {
        drawLabel({ header: shift.header, dateline: shift.dateline, lane: String(lane) });
      }
    }
  }

  // airport + bxb: two labels per shift, flowing
  slot = Math.ceil(slot / 10) * 10;
  for (const shift of typed.filter((t) => t.kind !== "Gate")) {
    drawLabel({ header: shift.header, dateline: shift.dateline, lane: "" });
    drawLabel({ header: shift.header, dateline: shift.dateline, lane: "" });
  }
  // pad the last partial page with generic BxB spares (as the 2022 sheet
  // did); with no shifts scheduled yet, emit one full page of spares rather
  // than an empty document
  do {
    drawLabel({ header: `${year}  BxB`, dateline: "", lane: "" });
  } while (slot % 10 !== 0);

  const bytes = await doc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="Census_${year}_Sampling_Bag_Labels.pdf"`
  );
  return res.send(Buffer.from(bytes));
};

export default withSuperAdmin(sampling);
