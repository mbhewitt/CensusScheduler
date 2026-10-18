-- Permanent record of every Census shift a volunteer worked (#759, Mew
-- 2026-10-18). One row per volunteer per shift, denormalized on purpose so it
-- stays true after the op_ tables roll over to the next season. Loaded by
-- etl/shift_history.py; the app only ever reads it.
--
-- Values are stored as recorded at the time ("Construction" stays
-- "Construction"); renames are a display concern.
CREATE TABLE op_shift_history (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  -- shiftboard2 = legacy Census copy of Shiftboard (2006-2025),
  -- sb_shifts = later Shiftboard pulls not in shiftboard2, app = op_ tables.
  source ENUM('shiftboard2', 'sb_shifts', 'app') NOT NULL,
  -- shiftboard2.id / sb_shifts.sb_shift_id / op_shift_time_position.time_position_id
  source_id BIGINT NOT NULL,
  shiftboard_id BIGINT NOT NULL,
  year SMALLINT NOT NULL,
  start_time DATETIME NOT NULL, -- playa-local (America/Los_Angeles)
  end_time DATETIME NULL,
  shift_name VARCHAR(128) NOT NULL,
  position VARCHAR(128) NULL,
  department VARCHAR(128) NULL,
  off_playa BOOLEAN NULL,
  -- Raw check-in state, NOT a no-show boolean: '' = checked in, 'Yes' =
  -- checked out / scored as no-show, 'X' = never checked in (app only).
  noshow VARCHAR(10) NULL,
  -- Scale depends on source: shiftboard2 reviews are 0-10, app ratings 1-5.
  rating TINYINT NULL,
  notes TEXT NULL,
  archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_source (source, source_id, shiftboard_id),
  KEY idx_volunteer (shiftboard_id, start_time),
  KEY idx_year (year)
);
