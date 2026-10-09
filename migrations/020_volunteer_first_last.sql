-- Okta sends first and last name separately; keep them (world_name stays the display name).
ALTER TABLE op_volunteers
  ADD COLUMN first_name VARCHAR(64) NULL AFTER world_name,
  ADD COLUMN last_name VARCHAR(64) NULL AFTER first_name;
