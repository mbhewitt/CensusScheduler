import assert from "node:assert/strict";
import { test } from "node:test";

import { PDFDocument, StandardFonts } from "pdf-lib";

import { splitSapPdf } from "../../lib/sapPdf";

// Build a one-page PDF whose text layer mimics a SAP batch page.
async function makeBatch(pagesText: string[][]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of pagesText) {
    const page = doc.addPage();
    lines.forEach((line, i) => {
      page.drawText(line, { x: 40, y: 750 - i * 20, size: 10, font });
    });
  }
  return Buffer.from(await doc.save());
}

// Body copy present on every real page — contains "Setup Access Pass (SAP)"
// with no date after it, which must never satisfy the date regex.
const BODY =
  "This Setup Access Pass (SAP) is NOT A TICKET and on its own does not " +
  "grant you access to Black Rock City before the event officially starts";

test("parses 2026-format pages (no '(SAP)' in header)", async () => {
  const buf = await makeBatch([
    [
      "Matthew Hewitt Face Value $0.00",
      "Setup Access Pass 8/26 & Later",
      "Black Rock City: Access 2026",
      BODY,
      "Ticket ID 473816590Confirmation Id39GG89B211922061",
    ],
  ]);
  const { pages, unparseable } = await splitSapPdf(buf);
  assert.equal(unparseable.length, 0);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].ticketId, "473816590");
  assert.equal(pages[0].sapDate, "2026-08-26");
});

test("still parses 2025-format pages ('(SAP)' in header)", async () => {
  const buf = await makeBatch([
    [
      "Setup Access Pass (SAP) 8/16 & Later",
      "Black Rock City: Access 2025",
      BODY,
      "Ticket ID 123456789",
    ],
  ]);
  const { pages, unparseable } = await splitSapPdf(buf);
  assert.equal(unparseable.length, 0);
  assert.equal(pages[0].sapDate, "2025-08-16");
});

test("quarantines pages missing fields instead of throwing", async () => {
  const buf = await makeBatch([[BODY, "Black Rock City: Access 2026"]]);
  const { pages, unparseable } = await splitSapPdf(buf);
  assert.equal(pages.length, 0);
  assert.equal(unparseable.length, 1);
  assert.match(unparseable[0].reason, /date/);
  assert.match(unparseable[0].reason, /ticket id/);
});
