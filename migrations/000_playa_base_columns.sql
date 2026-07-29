-- Migration: base-schema columns that the app assumes pre-exist but the
-- OnPlayaData base schema (used to seed the on-playa DB) does not have.
--
-- Numbered 000 so it runs BEFORE 009, which does
-- `ALTER TABLE op_volunteers ADD COLUMN arrival_auto_set ... AFTER arrival_date_id`
-- and therefore requires arrival_date_id to already exist.
--
-- Discovered on the 2026-07-29 on-playa deploy: on a bare OnPlayaData base DB
-- (zero app migrations applied), `st.canceled` and `arrival_date_id` are
-- missing, so /api/shifts, shift-eligibility, backfill-notify, the mail worker,
-- and migration 009 all fail. Cloud/prod already has these columns, so this
-- migration is guarded (information_schema check) and is a no-op there.
--
-- MySQL 8 has no "ADD COLUMN IF NOT EXISTS"; use a guarded stored proc.
-- Idempotent: safe to re-run.

DELIMITER $$

DROP PROCEDURE IF EXISTS _base_add_col $$
CREATE PROCEDURE _base_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = tbl)
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = DATABASE() AND table_name = tbl AND column_name = col)
  THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN ', ddl);
    PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
  END IF;
END $$

DELIMITER ;

-- op_shift_times.canceled — boolean "this shift-time was canceled" flag, read
-- as `st.canceled = false` by /api/shifts, shift-eligibility, and
-- backfill-notify. No other migration creates it.
CALL _base_add_col('op_shift_times', 'canceled',
  '`canceled` TINYINT(1) NOT NULL DEFAULT 0');

-- op_volunteers.arrival_date_id — the volunteer's arrival day (FK-shaped to
-- op_dates.date_id), written by the arrival-day form. Migration 009 adds
-- arrival_auto_set AFTER it, so it must exist first.
CALL _base_add_col('op_volunteers', 'arrival_date_id',
  '`arrival_date_id` BIGINT DEFAULT NULL');

DROP PROCEDURE IF EXISTS _base_add_col;
