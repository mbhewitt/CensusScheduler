-- Migration: add op_volunteers.mailing_list_new — persistent "New Volunteers
-- for Mailing List" membership flag (papabear 2026-07-24).
--
-- Set to 1 at account creation for a direct sign-up (self-register form, OR a
-- Burner Profile sign-in NOT arriving via a HIVE completion link). It is
-- PERSISTENT: it stays 1 even after the volunteer later completes HIVE, so they
-- aren't lost from the mailing list between CSV downloads. Reset to 0 only by
-- the "Clear Mailing List Report" action. HIVE-first arrivals are created with
-- 0 (never on the report). Admins/coordinators/staff are filtered out live by
-- the report query (their status can change), so they are NOT special-cased
-- here.
--
-- Backfill: for rows that already exist we have no historical HIVE-arrival
-- signal, so approximate "signed up without HIVE" as create_volunteer=1 and no
-- current Squaddie/Shift Lead role. Everyone else stays 0.

ALTER TABLE op_volunteers
  ADD COLUMN mailing_list_new TINYINT(1) NOT NULL DEFAULT 0;

UPDATE op_volunteers v
SET v.mailing_list_new = 1
WHERE v.create_volunteer = true
  AND v.delete_volunteer = false
  AND NOT EXISTS (
    SELECT 1
    FROM op_volunteer_roles vr
    WHERE vr.shiftboard_id = v.shiftboard_id
      AND vr.role_id IN (2000102, 2000101)
      AND vr.remove_role = false
  );
