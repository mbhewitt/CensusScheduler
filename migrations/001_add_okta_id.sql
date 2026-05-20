-- Add okta_id column to op_volunteers for Okta OAuth integration
-- This stores the unique Okta user ID (sub claim) for each volunteer
-- The unique index allows efficient lookup by okta_id and prevents duplicates

ALTER TABLE op_volunteers
  ADD COLUMN okta_id VARCHAR(255) DEFAULT NULL AFTER email,
  ADD UNIQUE INDEX idx_okta_id (okta_id);
