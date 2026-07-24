import fs from "node:fs/promises";
import path from "node:path";

import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { pool } from "lib/database";
import { withSuperAdmin } from "@/lib/withSuperAdmin";

// Data Wiz labels — port of the "Data Wiz <year>" template: a single Letter
// page of ten identical 2"x4" labels (Avery 5163/5523), year filled in from
// the event calendar. Text metrics from the docx (title/lines 14pt, notes
// 8pt); the pink census "C" is the template's embedded image.

const PAGE_W = 612;
const PAGE_H = 792;
const LABEL_W = 288;
const LABEL_H = 144;
const COL_EDGE = [11.25, 312.75];
const ROW_TOP0 = PAGE_H - 36;
const TEXT_INSET = 12;

const dataWiz = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ statusCode: 405, message: "Method not allowed" });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT YEAR(date) AS yr FROM op_dates
     WHERE datename='PreWed' AND delete_date=false LIMIT 1`
  );
  const year = rows[0]?.yr ?? new Date().getFullYear();

  const doc = await PDFDocument.create();
  doc.setTitle(`Data Wiz Labels ${year}`);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const logoBytes = await fs.readFile(
    path.join(process.cwd(), "lib", "labels", "census-c.png")
  );
  const logo = await doc.embedPng(logoBytes);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  const black = rgb(0, 0, 0);
  for (let s = 0; s < 10; s++) {
    const x = COL_EDGE[s % 2] + TEXT_INSET;
    const top = ROW_TOP0 - Math.floor(s / 2) * LABEL_H;
    page.drawText(`Data Wiz ${year}`, { x, y: top - 24, size: 14, font: helv, color: black });
    page.drawText("Name: ____________", { x, y: top - 56, size: 14, font: helv, color: black });
    page.drawText("Day/Time completed:", { x, y: top - 88, size: 14, font: helv, color: black });
    page.drawText("_________________", { x, y: top - 108, size: 14, font: helv, color: black });
    page.drawText("Notes:", { x, y: top - 128, size: 8, font: helv, color: black });
    // pink C, right side (template: ~1.39 x 1.65 in), vertically centered
    const w = 100;
    const h = (logo.height / logo.width) * w;
    page.drawImage(logo, {
      x: COL_EDGE[s % 2] + LABEL_W - w - 10,
      y: top - (LABEL_H + h) / 2,
      width: w,
      height: h,
    });
  }

  const bytes = await doc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="Data_Wiz_Labels_${year}.pdf"`
  );
  return res.send(Buffer.from(bytes));
};

export default withSuperAdmin(dataWiz);
