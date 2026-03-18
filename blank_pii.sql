-- Blank PII from test server database
-- Keeps: playa_name, passcode, shiftboard_id, roles, shift data
-- Removes: real names, emails, phone numbers, emergency contacts
UPDATE op_volunteers SET
    world_name = CONCAT("Volunteer ", shiftboard_id),
    email = NULL,
    phone = NULL,
    emergency_contact = NULL
WHERE playa_name != "Admin";
