// Client-safe QR defaults + types. Deliberately NO import from lib/qr — that
// module pulls in sharp/qrcode (server-only). The QrSettings shape here must
// stay in sync with lib/qr's QrSettings.
export type QrType = "calendar" | "link" | "wifi";

export interface QrSettings {
  fgColor: string;
  bgColor: string;
  border: boolean;
  logo: boolean;
  link?: string;
  calendar?: {
    title: string;
    date: string;
    time: string;
    durationMinutes: number;
    reminderMinutes: number;
    location: string;
  };
  wifi?: {
    ssid: string;
    password: string;
    encryption: "WPA" | "WEP" | "nopass";
    hidden: boolean;
  };
}

export const SIZE_OPTIONS = [
  { key: "sticker", label: "Sticker (~2in)" },
  { key: "flyer", label: "Flyer (~4in)" },
  { key: "large-banner", label: "Large banner (~10in)" },
  { key: "xl-banner", label: "XL banner (600 dpi)" },
];

export const CENSUS_URL = "https://census.burningman.org";
export const CENSUS_CAL_TITLE = "Fill out your Burning Man Census";

// First Thursday after the burn = Thursday of Labor-Day week (Labor Day = first
// Monday of September; Thursday is +3 days). Mirrors lib/qr.firstThursdayAfterBurn.
export function firstThursdayAfterBurn(year: number): string {
  const sep1 = new Date(Date.UTC(year, 8, 1));
  const offsetToMonday = (8 - sep1.getUTCDay()) % 7;
  const thursday = new Date(Date.UTC(year, 8, 1 + offsetToMonday + 3));
  const m = String(thursday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(thursday.getUTCDate()).padStart(2, "0");
  return `${thursday.getUTCFullYear()}-${m}-${d}`;
}

export function defaultSettings(type: QrType, year: number): QrSettings {
  const base = { fgColor: "#000000", bgColor: "#FFFFFF", border: true, logo: true };
  if (type === "calendar") {
    return {
      ...base,
      calendar: {
        title: CENSUS_CAL_TITLE,
        date: firstThursdayAfterBurn(year),
        time: "11:00",
        durationMinutes: 30,
        reminderMinutes: 5,
        location: CENSUS_URL,
      },
    };
  }
  if (type === "wifi") {
    return { ...base, wifi: { ssid: "", password: "", encryption: "WPA", hidden: false } };
  }
  return { ...base, link: CENSUS_URL };
}

// Default download filename: year + a defining characteristic.
export function defaultFilename(type: QrType, year: number, s: QrSettings): string {
  if (type === "calendar") return `${year}-census-calendar`;
  if (type === "wifi") return `${year}-wifi-${(s.wifi?.ssid || "network").replace(/\s+/g, "-")}`;
  return `${year}-census-link`;
}
