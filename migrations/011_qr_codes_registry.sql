-- QR code creator (#653): a registry of super-admin-created QR codes.
--
-- Each row is a QR the admin designed in the /qr-codes page. We store the QR's
-- payload (the string actually encoded) plus the design settings so the code can
-- be re-generated at any size/format on download and re-opened for editing
-- (round-trip, including an uploaded/decoded existing QR).
--
-- Why the columns:
--   qr_type    - 'calendar' | 'link' | 'wifi'. Drives which fields matter and how
--                the payload was built (VEVENT ics text / URL / WIFI: string).
--   payload    - the exact string encoded into the QR. Source of truth for both
--                regeneration and re-decoding; an uploaded QR is decoded straight
--                into here.
--   filename   - download filename (no extension). UNIQUE per spec so the registry
--                never has two rows fighting over the same download name.
--   settings   - JSON blob of design knobs (colors, border, logo on/off, ics
--                fields, wifi fields, link). Kept as JSON so adding a knob later
--                doesn't need a migration. All rendering reads from here.
--   purpose    - NULL normally; 'home' or 'download' when designated. Only ONE row
--                may hold each purpose at a time; enforced in the API (a designate
--                request clears the prior holder in the same request). Plain index
--                keeps that clear+set fast. (MySQL 8 has no partial unique index.)
--   burn_year / event_date / event_time / subject - denormalized for the registry
--                list columns (year / date / time / subject) without parsing payload.

CREATE TABLE IF NOT EXISTS op_qr_codes (
  qr_id        INT AUTO_INCREMENT PRIMARY KEY,
  qr_type      ENUM('calendar', 'link', 'wifi') NOT NULL,
  filename     VARCHAR(200) NOT NULL,
  subject      VARCHAR(255) NULL,
  payload      MEDIUMTEXT NOT NULL,
  settings     JSON NOT NULL,
  purpose      ENUM('home', 'download') NULL,
  burn_year    INT NULL,
  event_date   DATE NULL,
  event_time   TIME NULL,
  created_by   INT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_qr_filename (filename),
  KEY idx_qr_purpose (purpose)
);
