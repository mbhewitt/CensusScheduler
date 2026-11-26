-- Discord account link (C-863). One Discord user per volunteer, owned by the
-- app: the pumpkin gate reads it here instead of keeping its own mapping, and a
-- future "Connect Discord" on the profile writes this same column.
-- Snowflake ids are 17-20 digits; stored as text like okta_id.
ALTER TABLE op_volunteers
  ADD COLUMN discord_user_id VARCHAR(20) NULL AFTER bpguid,
  ADD UNIQUE INDEX idx_discord_user_id (discord_user_id);

-- Who may use the pumpkin ops bot: an ordinary role, granted from the Roles
-- page. role_id hand-picked in the 2000xxx range (see 003) so the constant is
-- stable across environments. Idempotent.
INSERT INTO op_roles (role_id, role, display, role_src)
VALUES (2000030, 'PumpkinUser', 1, 'system')
ON DUPLICATE KEY UPDATE role = VALUES(role),
                        display = VALUES(display),
                        role_src = VALUES(role_src);
