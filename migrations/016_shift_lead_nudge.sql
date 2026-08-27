-- Shift-lead nudge (#shift-lead-nudge): tracks which shifts have already had
-- their post-shift "wrap-up" nudge sent, so each shift is nudged at most once.
--
-- ~1 hour after a shift ends, a scheduled job (/api/cron/shift-lead-nudge)
-- emails the shift's leads (or the coordinator list for a leadless shift) if
-- either (A) someone is checked in but not reviewed, or (B) >30% of non-leads
-- aren't checked in — and finalizes the shift by converting every still-pending
-- (noshow 'X'/NULL) volunteer, leads included, to 'Yes' (no-show). This table is
-- the once-only marker: a shift present here is skipped on later runs.
--
--   shift_times_id - op_shift_times.shift_times_id that was nudged (PK).
--   sent_at        - when the nudge fired.

CREATE TABLE IF NOT EXISTS op_shift_lead_nudge (
  shift_times_id INT NOT NULL PRIMARY KEY,
  sent_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
