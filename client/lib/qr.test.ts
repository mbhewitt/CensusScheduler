import { strict as assert } from "node:assert";

import {
  buildPayload,
  defaultCalendar,
  firstThursdayAfterBurn,
  payloadToSettings,
  type QrSettings,
} from "./qr";

// first Thursday after the burn == Thursday of Labor-Day week.
// 2026: Labor Day = Sep 7 (Mon) -> Thu Sep 10.
assert.equal(firstThursdayAfterBurn(2026), "2026-09-10");
// 2024: Labor Day = Sep 2 (Mon) -> Thu Sep 5.
assert.equal(firstThursdayAfterBurn(2024), "2024-09-05");

const base: QrSettings = {
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  border: true,
  logo: false,
};

// wifi payload + escaping of special chars.
const wifi = buildPayload("wifi", {
  ...base,
  wifi: { ssid: "Census;Net", password: "p:a,ss", encryption: "WPA", hidden: false },
});
assert.equal(wifi, "WIFI:S:Census\\;Net;T:WPA;P:p\\:a\\,ss;;");
// round-trips back to editable settings.
const back = payloadToSettings(wifi);
assert.equal(back.type, "wifi");
assert.equal(back.settings.wifi?.ssid, "Census;Net");
assert.equal(back.settings.wifi?.password, "p:a,ss");

// calendar VEVENT contains a real event + alarm.
const cal = buildPayload("calendar", { ...base, calendar: defaultCalendar(2026) });
assert.match(cal, /BEGIN:VEVENT/);
assert.match(cal, /SUMMARY:Fill out your Burning Man Census/);
assert.match(cal, /BEGIN:VALARM/);
const calBack = payloadToSettings(cal);
assert.equal(calBack.type, "calendar");
assert.equal(calBack.settings.calendar?.date, "2026-09-10");
assert.equal(calBack.settings.calendar?.time, "11:00");

// link passthrough.
assert.equal(buildPayload("link", { ...base, link: "https://x.io" }), "https://x.io");
assert.equal(payloadToSettings("https://x.io").type, "link");

// eslint-disable-next-line no-console
console.log("qr.test.ts OK");
