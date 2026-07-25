-- Migration: Tablet Responsibility Agreement (papabear 2026-07-25).
--
-- Signing is stored as a self-sign volunteer role (like BehavioralStandards /
-- BurnerProfileUpdated) so the /info checklist can read it and admins can audit
-- it the same way. role_id 2000030 in the 2000xxx status-flag range → stable
-- constant ROLE_TABLET_AGREEMENT_ID. display=0 (self-managed, not an admin flip).
--
-- The agreement form also captures camp name + camp address (phone already
-- exists on op_volunteers). Idempotent-ish.

INSERT INTO op_roles (role_id, role, display, role_src)
VALUES (2000030, 'TabletAgreement', 0, 'system')
ON DUPLICATE KEY UPDATE role = VALUES(role);

ALTER TABLE op_volunteers
  ADD COLUMN camp_name mediumtext
    CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  ADD COLUMN camp_address mediumtext
    CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL;
