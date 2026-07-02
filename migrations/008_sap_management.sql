-- Migration: SAP (Setup Access Pass) management. See SAP super-admin page work.
--
-- Turns op_saps from a file<->person coupling into a managed POOL with a
-- delivery lifecycle, adds an off-book people table, and gives op_email_queue a
-- generic (PDF) attachment alongside its existing ICS one.
--
-- Why each column:
--   ticket_id  - the "Ticket ID 4344012xx" printed on every SAP page; unique per
--                pass, so re-uploading the same batch PDF is idempotent (dedupe).
--   sap_date   - the "8/16 & Later" arrival date parsed from the page. A SAP is
--                valid ON OR AFTER this date, so an earlier SAP is a safe substitute.
--   burn_year  - burn_year(sap_date): the calendar year for Jan-Sep, year+1 for
--                Oct-Dec. The page filters to the current burn year so last year's
--                SAPs (wrong dates) never show.
--   status     - available -> assigned -> received (downloaded/emailed, LOCKED) ;
--                burned when a received SAP is superseded by a manual re-issue.
--   assigned_email / op_sap_offbook - manage SAPs "off-book" for people not (yet)
--                in op_volunteers; linked to a shiftboard_id on first Okta login.
--
-- MySQL 8 has no "ADD COLUMN IF NOT EXISTS", so we use guarded stored procs that
-- consult information_schema. Idempotent: safe to re-run.

DELIMITER $$

DROP PROCEDURE IF EXISTS _sap_add_col $$
CREATE PROCEDURE _sap_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
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

DROP PROCEDURE IF EXISTS _sap_add_index $$
CREATE PROCEDURE _sap_add_index(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN ddl TEXT)
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = tbl)
     AND NOT EXISTS (SELECT 1 FROM information_schema.statistics
                     WHERE table_schema = DATABASE() AND table_name = tbl AND index_name = idx)
  THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD ', ddl);
    PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
  END IF;
END $$

DELIMITER ;

-- Base table for a fresh DB that never imported the OnPlayaData op_saps.
-- (No-op where it already exists; the guarded ALTERs below add the new columns.)
CREATE TABLE IF NOT EXISTS `op_saps` (
  `sap_id` bigint NOT NULL AUTO_INCREMENT,
  `filename` varchar(256) NOT NULL,
  `shiftboard_id` bigint DEFAULT NULL,
  `date_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sap_id`),
  KEY `idx_sap_volunteer` (`shiftboard_id`),
  KEY `idx_sap_date` (`date_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- New op_saps columns (pool + lifecycle).
CALL _sap_add_col('op_saps', 'ticket_id',          '`ticket_id` VARCHAR(32) NULL');
CALL _sap_add_col('op_saps', 'sap_date',           '`sap_date` DATE NULL');
CALL _sap_add_col('op_saps', 'burn_year',          '`burn_year` SMALLINT NULL');
CALL _sap_add_col('op_saps', 'status',             "`status` ENUM('available','assigned','received','burned') NOT NULL DEFAULT 'available'");
CALL _sap_add_col('op_saps', 'assigned_email',     '`assigned_email` VARCHAR(256) NULL');
CALL _sap_add_col('op_saps', 'assigned_at',        '`assigned_at` TIMESTAMP NULL');
CALL _sap_add_col('op_saps', 'received_at',        '`received_at` TIMESTAMP NULL');
CALL _sap_add_col('op_saps', 'received_via',       "`received_via` ENUM('download','email') NULL");
CALL _sap_add_col('op_saps', 'superseded_by_sap_id','`superseded_by_sap_id` BIGINT NULL');
CALL _sap_add_col('op_saps', 'uploaded_by',        '`uploaded_by` BIGINT NULL');

-- A pooled SAP need not match an op_dates row (esp. a wrong-year date), so
-- date_id must be nullable. The OnPlayaData base table declares it NOT NULL.
SET @date_id_notnull = (SELECT IF(COUNT(*) > 0, 1, 0) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'op_saps'
    AND column_name = 'date_id' AND is_nullable = 'NO');
SET @sql = IF(@date_id_notnull = 1,
  'ALTER TABLE `op_saps` MODIFY COLUMN `date_id` bigint NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CALL _sap_add_index('op_saps', 'uq_sap_ticket',      'UNIQUE INDEX `uq_sap_ticket` (`ticket_id`)');
CALL _sap_add_index('op_saps', 'idx_sap_status_date','INDEX `idx_sap_status_date` (`status`, `sap_date`)');
CALL _sap_add_index('op_saps', 'idx_sap_burn_year',  'INDEX `idx_sap_burn_year` (`burn_year`)');

-- Legacy rows (pre-pool: a row tied to a volunteer with no ticket_id) were
-- already issued passes; mark them received so they stay visible and locked.
UPDATE `op_saps`
   SET `status` = 'received', `received_via` = 'download'
 WHERE `ticket_id` IS NULL AND `shiftboard_id` IS NOT NULL AND `status` = 'available';

-- Off-book people: manage SAPs for someone not in op_volunteers. Linked to a
-- shiftboard_id on first Okta login by email.
CREATE TABLE IF NOT EXISTS `op_sap_offbook` (
  `email` VARCHAR(256) NOT NULL,
  `name` VARCHAR(256) NULL,
  `notes` TEXT NULL,
  `linked_shiftboard_id` BIGINT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Generic attachment for op_email_queue (emailing a SAP PDF), separate from the
-- existing ics_attachment / ics_filename pair. Requires migration 002 applied.
CALL _sap_add_col('op_email_queue', 'attachment',          '`attachment` MEDIUMBLOB NULL');
CALL _sap_add_col('op_email_queue', 'attachment_filename', '`attachment_filename` VARCHAR(255) NULL');

DROP PROCEDURE IF EXISTS _sap_add_col;
DROP PROCEDURE IF EXISTS _sap_add_index;
