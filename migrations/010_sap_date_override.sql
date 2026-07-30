-- SAP page: persist the admin-chosen SAP date between sessions (dropdown
-- choice used to live only in client state). NULL = Auto.
ALTER TABLE op_volunteers ADD COLUMN sap_date_override DATE NULL;
ALTER TABLE op_sap_offbook ADD COLUMN sap_date_override DATE NULL;
