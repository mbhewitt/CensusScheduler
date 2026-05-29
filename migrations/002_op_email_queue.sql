-- Email queue table. See #307.
--
-- All concrete email features (per-assignment, periodic digest, SAP-ready,
-- contact-form send, critical-drop) enqueue rows here. A worker drains the
-- queue with 1/min + 100/day rate limits and exponential backoff capped at
-- 24h. On-playa internet outages may last days — transient failures keep
-- retrying forever; only permanent SMTP errors mark the row `dead`.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS `op_email_queue` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `to` TEXT NOT NULL,
  `cc` TEXT NULL,
  `reply_to` TEXT NOT NULL,
  `from` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(998) NOT NULL,
  `body_text` MEDIUMTEXT NOT NULL,
  `body_html` MEDIUMTEXT NULL,
  `ics_attachment` MEDIUMBLOB NULL,
  `ics_filename` VARCHAR(255) NULL,
  `category` VARCHAR(64) NOT NULL,
  `enqueued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `next_attempt_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` DATETIME NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `state` ENUM('queued','sending','sent','failed','dead') NOT NULL DEFAULT 'queued',
  `last_error` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_state_next` (`state`, `next_attempt_at`),
  KEY `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
