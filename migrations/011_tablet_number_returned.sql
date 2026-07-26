-- Migration: per-assignment tablet tracking (papabear 2026-07-26).
--
-- Shift Leads/Coords/Admins record the tablet number handed to a Squaddie at
-- check-in and flip "returned" when it comes back. Both live on the shift
-- assignment (op_volunteer_shifts), not the volunteer. tablet_number is the
-- 2-digit tablet id (numeric, sortable); tablet_returned is the return toggle.

ALTER TABLE op_volunteer_shifts
  ADD COLUMN tablet_number smallint DEFAULT NULL,
  ADD COLUMN tablet_returned tinyint(1) NOT NULL DEFAULT 0;
