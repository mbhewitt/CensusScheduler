-- Migration: backfill missing passcodes left by the Okta path-2 bug.
--
-- The Okta callback (client/src/pages/api/auth/okta/callback.ts) has three
-- account-creation paths. The "canonical shiftboard_id known from Shiftboard
-- email history (sb_pinfo) but no op_volunteers row yet" path created the
-- volunteer WITHOUT a passcode, unlike the other two paths (existing rows keep
-- their imported passcode; truly-new rows auto-generate one). Mew confirmed
-- (2026-06-10) these should be treated like any other new volunteer and get an
-- auto-generated 4-digit passcode. The code fix sets it on creation going
-- forward; this backfills rows already created without one.
--
-- generatePasscode() in the app produces a zero-padded 4-digit string
-- (0000-9999); LPAD(FLOOR(RAND()*10000),4,'0') matches that shape, and RAND()
-- is evaluated per row so each affected volunteer gets a distinct code.
--
-- Idempotent: only touches rows missing a passcode. On prod (2026-06-10) this
-- affects 2 Okta volunteers.

UPDATE op_volunteers
SET passcode = LPAD(FLOOR(RAND() * 10000), 4, '0')
WHERE passcode IS NULL OR TRIM(passcode) = '';
