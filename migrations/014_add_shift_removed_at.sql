-- Track when a signup was removed so "schedule changed since last email" can
-- detect removals, not just adds (signed_up_at). op_volunteer_shifts is
-- app-managed (no ETL writes it), so the app's remove path stamps removed_at
-- and a re-add clears it back to NULL.
ALTER TABLE op_volunteer_shifts ADD COLUMN removed_at DATETIME NULL AFTER signed_up_at;
