// Server-side SAP batch PDF parsing + splitting. Each page of a Burning Man SAP
// batch carries a text layer (no OCR): the arrival date ("8/16 & Later"), the
// event year ("...Access 2025"), and a unique "Ticket ID". We read that text
// with pdfjs and copy each page into its own one-page PDF with pdf-lib.
import { PDFDocument } from "pdf-lib";
// Legacy build: the Node-friendly pdfjs entry (no DOM/worker assumptions for
// text extraction). Marked external in next.config so it loads from
// node_modules at runtime.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { burnYear } from "./sap";

const RE_DATE = /Setup Access Pass \(SAP\)\s*(\d{1,2})\/(\d{1,2})\s*&\s*Later/i;
const RE_YEAR = /Access\s*(\d{4})/i;
const RE_TICKET = /Ticket ID\s*(\d+)/i;

export interface ParsedSapPage {
  ticketId: string;
  sapDate: string; // YYYY-MM-DD
  burnYear: number;
  bytes: Uint8Array; // a one-page PDF
}

export interface UnparseablePage {
  page: number; // 1-based
  reason: string;
}

export interface SplitResult {
  pages: ParsedSapPage[];
  unparseable: UnparseablePage[];
}

// Split a SAP batch PDF into per-pass pages with parsed metadata. Pages whose
// date/year/ticket can't be read are reported in `unparseable` and never
// silently dropped. Throws only if the buffer isn't a readable PDF at all.
export async function splitSapPdf(buf: Buffer): Promise<SplitResult> {
  const doc = await getDocument({
    data: new Uint8Array(buf),
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;
  const src = await PDFDocument.load(buf);

  const pages: ParsedSapPage[] = [];
  const unparseable: UnparseablePage[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");

    const d = text.match(RE_DATE);
    const y = text.match(RE_YEAR);
    const t = text.match(RE_TICKET);
    if (!d || !y || !t) {
      const missing = [!d && "date", !y && "year", !t && "ticket id"]
        .filter(Boolean)
        .join(", ");
      unparseable.push({ page: i, reason: `missing ${missing}` });
      continue;
    }

    const sapDate = `${y[1]}-${d[1].padStart(2, "0")}-${d[2].padStart(2, "0")}`;
    const out = await PDFDocument.create();
    const [copied] = await out.copyPages(src, [i - 1]);
    out.addPage(copied);
    const bytes = await out.save();

    pages.push({
      ticketId: t[1],
      sapDate,
      burnYear: burnYear(sapDate),
      bytes,
    });
  }

  await doc.cleanup();
  return { pages, unparseable };
}
