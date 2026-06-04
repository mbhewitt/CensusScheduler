-- Migration: seed the EmailUnsubscribed role.
--
-- Stored as a regular volunteer role (op_volunteer_roles) so the flag
-- lives next to every other per-volunteer flag — OtherSAP, BurnerProfileUpdated,
-- BehavioralStandards, etc. — and so admins/the role admin UI can audit it the
-- same way.
--
-- role_id 2000020 is hand-picked in the 2000xxx status-flag range
-- (ROLE_BURNER_PROFILE_UPDATED_ID=2000010, ROLE_OTHER_SAP_ID=2000007,
-- ROLE_STAFF_ID=2000006) so the constant in client/src/constants.ts is stable
-- across environments.
--
-- display=0: this is a self-managed preference, not something admins flip from
-- the Roles list.
--
-- Idempotent: safe to re-run.

INSERT INTO op_roles (role_id, role, display, role_src)
VALUES (2000020, 'EmailUnsubscribed', 0, 'system')
ON DUPLICATE KEY UPDATE role = VALUES(role),
                        display = VALUES(display),
                        role_src = VALUES(role_src);
