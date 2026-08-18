// QR code creator core (#653). Pure-ish helpers shared by the /api/qr-codes
// endpoints: build the encoded payload for each type, render PNG/SVG with an
// optional centered logo + border + colors, and decode an uploaded QR image.
//
// Libraries over hand-rolling (per the issue): `ics` for the VEVENT, `qrcode`
// for encode, `sharp` for raster compositing/resizing, `jsqr` for decode.
import { promises as fs } from "node:fs";
import path from "node:path";

import { createEvent, type EventAttributes } from "ics";
import jsQR from "jsqr";
import QRCode from "qrcode";
import sharp from "sharp";

export type QrType = "calendar" | "link" | "wifi" | "text";

// Design knobs stored in op_qr_codes.settings (JSON). Everything needed to
// re-render or re-open a QR for editing lives here.
export interface QrSettings {
  // styling
  fgColor: string; // "#000000"
  bgColor: string; // "#FFFFFF"
  border: boolean; // quiet-zone margin on/off
  logo: boolean; // overlay the Census logo in the middle
  // type-specific source fields (kept so the editor can round-trip)
  link?: string;
  calendar?: {
    title: string;
    date: string; // "YYYY-MM-DD" local Pacific
    time: string; // "HH:mm" 24h local Pacific
    durationMinutes: number;
    reminderMinutes: number;
    location: string; // plain text or a URL; emitted as VEVENT LOCATION (#662)
    description?: string; // free text, may hold a URL; emitted as VEVENT DESCRIPTION (#662)
  };
  text?: string; // plain-text payload for the "text" type (#661)
  wifi?: {
    ssid: string;
    password: string;
    encryption: "WPA" | "WEP" | "nopass";
    hidden: boolean;
  };
}

// Output size presets. Physical target -> pixel width. Only web + two print
// sizes as raster; anything bigger should use the lossless SVG download.
export const SIZE_PRESETS: Record<string, { px: number; label: string }> = {
  web: { px: 512, label: "Web (512 px)" },
  in2: { px: 1200, label: "2 in (600 dpi)" },
  in6: { px: 3600, label: "6 in (600 dpi)" },
};

export const CENSUS_URL = "https://census.burningman.org";
export const CENSUS_CAL_TITLE = "Fill out your Burning Man Census";
const LOGO_PATH = path.join(process.cwd(), "public", "general", "logo-census.png");

// --- payload builders -------------------------------------------------------

// The first Thursday strictly after the burn (= after Labor-Day Monday, i.e.
// the first Thursday in September on/after the Tuesday teardown). Burning Man
// ends the Monday of US Labor Day; "first Thursday after the burn" is the
// Thursday of that same week. We compute the Labor Day Monday for the year then
// take that week's Thursday (+3 days).
export function firstThursdayAfterBurn(year: number): string {
  // Labor Day = first Monday of September.
  const sep1 = new Date(Date.UTC(year, 8, 1));
  const dow = sep1.getUTCDay(); // 0 Sun..6 Sat
  const offsetToMonday = (8 - dow) % 7; // days from Sep 1 to first Monday
  const laborDay = new Date(Date.UTC(year, 8, 1 + offsetToMonday));
  const thursday = new Date(laborDay);
  thursday.setUTCDate(laborDay.getUTCDate() + 3); // Mon -> Thu
  const m = String(thursday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(thursday.getUTCDate()).padStart(2, "0");
  return `${thursday.getUTCFullYear()}-${m}-${d}`;
}

// Default calendar settings for a given burn year.
export function defaultCalendar(year: number): NonNullable<QrSettings["calendar"]> {
  return {
    title: CENSUS_CAL_TITLE,
    date: firstThursdayAfterBurn(year),
    time: "11:00",
    durationMinutes: 30,
    reminderMinutes: 5,
    location: CENSUS_URL,
  };
}

// Escape per the WIFI: QR spec — backslash-escape \ ; , : and ".
function wifiEscape(s: string): string {
  return s.replace(/([\\;,:"])/g, "\\$1");
}

// Build the exact string encoded into the QR from the settings.
export function buildPayload(type: QrType, s: QrSettings): string {
  if (type === "link") {
    const url = (s.link ?? "").trim();
    if (!url) throw new Error("Link is required");
    return url;
  }
  if (type === "text") {
    const t = (s.text ?? "").trim();
    if (!t) throw new Error("Text is required");
    return t; // arbitrary text, encoded verbatim
  }
  if (type === "wifi") {
    const w = s.wifi;
    if (!w?.ssid) throw new Error("WiFi SSID is required");
    const parts = [`S:${wifiEscape(w.ssid)}`, `T:${w.encryption}`];
    if (w.encryption !== "nopass") parts.push(`P:${wifiEscape(w.password ?? "")}`);
    if (w.hidden) parts.push("H:true");
    return `WIFI:${parts.join(";")};;`;
  }
  // calendar -> a real VEVENT so scanning adds the event directly.
  const c = s.calendar;
  if (!c?.title || !c.date || !c.time) {
    throw new Error("Calendar title, date and time are required");
  }
  const [y, mo, d] = c.date.split("-").map(Number);
  const [hh, mm] = c.time.split(":").map(Number);
  // #662: LOCATION is free text (e.g. "Census Lab at 6:30 & A"); a URL, if any,
  // lives in the location or the description. Only emit VEVENT URL when we
  // actually have one, so plain-text locations no longer require a hyperlink.
  const isUrl = (v?: string) => /^https?:\/\//i.test((v ?? "").trim());
  const eventUrl = isUrl(c.location)
    ? c.location.trim()
    : isUrl(c.description)
      ? (c.description ?? "").trim()
      : undefined;
  const attrs: EventAttributes = {
    title: c.title,
    // ics treats a bare [Y,M,D,h,m] array as local (floating) time — exactly
    // what we want: "11am Pacific" should fire at 11am on the attendee's phone
    // interpreted in the event's local zone. Floating avoids TZ-library bloat.
    start: [y, mo, d, hh, mm],
    startInputType: "local",
    duration: { minutes: c.durationMinutes },
    ...(c.location ? { location: c.location } : {}),
    ...(c.description ? { description: c.description } : {}),
    ...(eventUrl ? { url: eventUrl } : {}),
    alarms: [
      {
        action: "display",
        description: c.title,
        trigger: { minutes: c.reminderMinutes, before: true },
      },
    ],
  };
  const { error, value } = createEvent(attrs);
  if (error || !value) throw new Error(`Could not build calendar event: ${error}`);
  // ics converts a "local" start to UTC using the *server's* timezone, which
  // would make the event fire at the wrong wall-clock on the attendee's phone.
  // We want floating local time ("11am wherever you scan it"), so rewrite the
  // DTSTART/DTEND to the intended wall-clock with no Z suffix (RFC 5545 floating).
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const startFloat = `${y}${pad2(mo)}${pad2(d)}T${pad2(hh)}${pad2(mm)}00`;
  const endMin = hh * 60 + mm + c.durationMinutes;
  const endFloat = `${y}${pad2(mo)}${pad2(d)}T${pad2(Math.floor(endMin / 60))}${pad2(endMin % 60)}00`;
  return value
    .replace(/DTSTART:[0-9TZ]+/, `DTSTART:${startFloat}`)
    .replace(/DTEND:[0-9TZ]+/, `DTEND:${endFloat}`);
}

// --- rendering --------------------------------------------------------------

// SVG string. Border=false trims the quiet-zone margin. Logo is composited as a
// data-URI <image> centered over the modules; high error correction (H) keeps it
// scannable. SVG is the lossless option for very large print.
export async function renderSvg(payload: string, s: QrSettings): Promise<string> {
  let svg = await QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: s.border ? 4 : 0,
    color: { dark: s.fgColor, light: s.bgColor },
  });
  if (s.logo) {
    const logoBuf = await fs.readFile(LOGO_PATH);
    const dataUri = `data:image/png;base64,${logoBuf.toString("base64")}`;
    // viewBox is "0 0 N N"; place a centered image ~22% of the side over a
    // matching bg pad so the logo sits on clean background, not on modules.
    const vb = /viewBox="0 0 (\d+(?:\.\d+)?) /.exec(svg);
    const side = vb ? Number(vb[1]) : 100;
    const logoSide = side * 0.22;
    const pad = logoSide * 1.15;
    const c = (side - logoSide) / 2;
    const overlay =
      `<circle cx="${side / 2}" cy="${side / 2}" r="${pad / 2}" fill="${s.bgColor}"/>` +
      `<image x="${c}" y="${c}" width="${logoSide}" height="${logoSide}" href="${dataUri}"/>`;
    svg = svg.replace("</svg>", `${overlay}</svg>`);
  }
  return svg;
}

// PNG buffer at the requested pixel width. We render the QR at target size via
// qrcode, then composite the logo with sharp so the overlay is crisp at any DPI.
export async function renderPng(
  payload: string,
  s: QrSettings,
  px: number,
): Promise<Buffer> {
  const base = await QRCode.toBuffer(payload, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: s.border ? 4 : 0,
    width: px,
    color: { dark: s.fgColor, light: s.bgColor },
  });
  if (!s.logo) return base;

  const logoSide = Math.round(px * 0.22);
  const pad = Math.round(logoSide * 1.15);
  const logo = await sharp(LOGO_PATH)
    .resize(logoSide, logoSide, { fit: "contain", background: s.bgColor })
    .png()
    .toBuffer();
  // A circular background disc so the round logo sits on clean bg, not on modules.
  const padImg = await sharp(
    Buffer.from(
      `<svg width="${pad}" height="${pad}"><circle cx="${pad / 2}" cy="${pad / 2}" r="${pad / 2}" fill="${s.bgColor}"/></svg>`,
    ),
  )
    .png()
    .toBuffer();
  return sharp(base)
    .composite([
      { input: padImg, gravity: "center" },
      { input: logo, gravity: "center" },
    ])
    .png()
    .toBuffer();
}

// --- decode (upload round-trip) ---------------------------------------------

// Decode an uploaded QR image (any format sharp reads) back to its payload
// string. Returns null if no QR is found.
export async function decodeQr(fileBuf: Buffer): Promise<string | null> {
  const { data, info } = await sharp(fileBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const result = jsQR(new Uint8ClampedArray(data.buffer), info.width, info.height);
  return result?.data ?? null;
}

// Given a decoded payload, infer type + reconstruct editable settings so the
// editor can round-trip it. Best-effort: unknown payloads become a link.
export function payloadToSettings(payload: string): {
  type: QrType;
  settings: Partial<QrSettings>;
} {
  const base: Pick<QrSettings, "fgColor" | "bgColor" | "border" | "logo"> = {
    fgColor: "#000000",
    bgColor: "#FFFFFF",
    border: true,
    logo: false,
  };
  if (/^WIFI:/i.test(payload)) {
    const body = payload.replace(/^WIFI:/i, "").replace(/;;\s*$/, "");
    const get = (k: string) => {
      const m = new RegExp(`(?:^|;)${k}:((?:\\\\.|[^;])*)`).exec(body);
      return m ? m[1].replace(/\\([\\;,:"])/g, "$1") : "";
    };
    const enc = (get("T") || "WPA") as "WPA" | "WEP" | "nopass";
    return {
      type: "wifi",
      settings: {
        ...base,
        wifi: {
          ssid: get("S"),
          password: get("P"),
          encryption: enc,
          hidden: /(?:^|;)H:true/i.test(body),
        },
      },
    };
  }
  if (/BEGIN:VEVENT/i.test(payload) || /BEGIN:VCALENDAR/i.test(payload)) {
    const field = (k: string) => {
      const m = new RegExp(`${k}[^:\\r\\n]*:(.+)`, "i").exec(payload);
      return m ? m[1].trim() : "";
    };
    const dt = field("DTSTART");
    // DTSTART like 20260910T110000 -> date/time
    const dm = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/.exec(dt);
    const date = dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : "";
    const time = dm ? `${dm[4]}:${dm[5]}` : "11:00";
    return {
      type: "calendar",
      settings: {
        ...base,
        calendar: {
          title: field("SUMMARY") || CENSUS_CAL_TITLE,
          date,
          time,
          durationMinutes: 30,
          reminderMinutes: 5,
          location: field("LOCATION") || field("URL") || CENSUS_URL,
          description: field("DESCRIPTION") || undefined,
        },
      },
    };
  }
  if (/^https?:\/\//i.test(payload)) {
    return { type: "link", settings: { ...base, link: payload } };
  }
  // Anything else is arbitrary text (#661), not a link.
  return { type: "text", settings: { ...base, text: payload } };
}
