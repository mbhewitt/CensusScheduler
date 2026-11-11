-- Blank PII from test server database
-- Keeps: playa_name, passcode, shiftboard_id, roles, shift data
-- Removes: real names, emails, phone numbers, emergency contacts
UPDATE op_volunteers SET
    world_name = CONCAT("Volunteer ", shiftboard_id),
    email = NULL,
    phone = NULL,
    emergency_contact = NULL
WHERE playa_name != "Admin";

-- Additional PII sources beyond op_volunteers (found 2026-08-10): the schema grew
-- more email columns. Without these, a snapshot refresh re-leaks real addresses
-- even though op_volunteers is scrubbed.
UPDATE op_messages    SET email          = NULL WHERE email          IS NOT NULL;
UPDATE op_sap_offbook SET email          = NULL WHERE email          IS NOT NULL;
UPDATE op_saps        SET assigned_email = NULL WHERE assigned_email IS NOT NULL;

-- These two carry real emails as data/keys and aren't needed on a test box, so clear them:
--   op_email_queue       -- real recipient addresses + message bodies (an outbound send queue)
--   op_role_grant_roster -- email is part of the PRIMARY KEY (NOT NULL) so it can't be blanked
--                           in place; it's only an email->role pre-provisioning map, which is
--                           useless once volunteer emails are scrubbed.
TRUNCATE TABLE op_email_queue;
TRUNCATE TABLE op_role_grant_roster;
