-- Burner Profile GUID, sent by Okta as the `bpguid` claim and saved at login.
ALTER TABLE op_volunteers
  ADD COLUMN bpguid VARCHAR(64) NULL AFTER okta_id;
