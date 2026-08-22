-- Tablet device provisioning (#tablet-passcode): single-use tokens that turn a
-- specific tablet into a "trusted device" allowed to use passcode sign-in.
--
-- Flow: a super-admin mints a token (rendered as a QR on their phone); the
-- tablet scans it and hits /api/provision/claim, which validates+consumes the
-- token here and sets the long-lived signed `census-device` cookie. Passcode
-- sign-in (/api/sign-in) is refused unless that cookie is present, so
-- participants on the same network/egress-IP can never passcode-login.
--
-- Why the columns:
--   token       - opaque random string (base64url) encoded in the QR. Looked up
--                 on claim; UNIQUE so a token maps to exactly one row.
--   created_by  - shiftboard_id of the super-admin who minted it (audit).
--   expires_at  - short TTL (minutes). A scanned-late / photographed QR is dead
--                 after this.
--   consumed_at - NULL until claimed; set on first successful claim. Single-use:
--                 a second claim with the same token is rejected.
--
-- The trusted-device cookie itself is STATELESS (HMAC-signed, key derived from
-- SESSION_SECRET) — no devices table. "Deprovision all" = rotate SESSION_SECRET.

CREATE TABLE IF NOT EXISTS op_provision_tokens (
  token       VARCHAR(64) NOT NULL PRIMARY KEY,
  created_by  INT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP NULL,
  KEY idx_provision_expires (expires_at)
);
