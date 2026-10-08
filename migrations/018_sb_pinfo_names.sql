-- Keep the name fields the Shiftboard profile export already gives us, so
-- people with no app account still have a name (and their Burner Profile GUID).
ALTER TABLE sb_pinfo
  ADD COLUMN first_name VARCHAR(64) NULL,
  ADD COLUMN last_name VARCHAR(64) NULL,
  ADD COLUMN playa_name VARCHAR(128) NULL,
  ADD COLUMN bpguid VARCHAR(64) NULL;
