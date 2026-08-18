// DB helpers for the QR registry (#653). Row mapping + the shared derive of
// the denormalized list columns (subject/burn_year/date/time) from the type +
// settings, so create and update stay consistent.
import type { RowDataPacket } from "mysql2";

import { pool } from "lib/database";
import { CENSUS_CAL_TITLE, type QrSettings, type QrType } from "lib/qr";

export interface QrRow extends RowDataPacket {
  qr_id: number;
  qr_type: QrType;
  filename: string;
  subject: string | null;
  payload: string;
  settings: string | QrSettings; // JSON column comes back parsed on mysql2 >=3
  purpose: "home" | "download" | null;
  burn_year: number | null;
  event_date: string | null;
  event_time: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export function mapQrRow(r: QrRow) {
  const settings =
    typeof r.settings === "string" ? (JSON.parse(r.settings) as QrSettings) : r.settings;
  return {
    qrId: r.qr_id,
    qrType: r.qr_type,
    filename: r.filename,
    subject: r.subject,
    payload: r.payload,
    settings,
    purpose: r.purpose,
    burnYear: r.burn_year,
    eventDate: r.event_date,
    eventTime: r.event_time,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// The list-view columns derived from the design. Calendar rows get their
// date/time/subject from the ics fields; link/wifi get a subject only.
export function deriveListFields(type: QrType, settings: QrSettings) {
  if (type === "calendar" && settings.calendar) {
    const c = settings.calendar;
    const [y] = c.date.split("-").map(Number);
    return {
      subject: c.title || CENSUS_CAL_TITLE,
      burnYear: Number.isFinite(y) ? y : null,
      eventDate: c.date || null,
      eventTime: c.time ? `${c.time}:00` : null,
    };
  }
  if (type === "wifi" && settings.wifi) {
    return { subject: `WiFi: ${settings.wifi.ssid}`, burnYear: null, eventDate: null, eventTime: null };
  }
  if (type === "text") {
    return { subject: settings.text ?? "Text", burnYear: null, eventDate: null, eventTime: null };
  }
  return { subject: settings.link ?? "Link", burnYear: null, eventDate: null, eventTime: null };
}

export async function getQrById(qrId: number): Promise<ReturnType<typeof mapQrRow> | null> {
  const [rows] = await pool.query<QrRow[]>(`SELECT * FROM op_qr_codes WHERE qr_id = ?`, [qrId]);
  return rows[0] ? mapQrRow(rows[0]) : null;
}
