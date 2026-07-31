-- SAP page: per-person free-text notes so super-admins (Mew, Rescue) can
-- record why they made an exception. Volunteers keep theirs on op_volunteers;
-- off-book people reuse the existing op_sap_offbook.notes column.
ALTER TABLE op_volunteers ADD COLUMN sap_notes TEXT NULL;
