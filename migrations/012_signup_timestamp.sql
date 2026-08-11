-- Record WHEN a shift was signed up for, so we can attribute *new* signups to
-- welcome/nudge emails. Today op_volunteer_shifts carries only boolean flags
-- (add_shift/remove_shift/update_shift) with no time, so "which email led to a
-- signup" is unanswerable. Additive nullable column: existing rows stay NULL,
-- nothing else changes. The signup API stamps NOW() on the fresh INSERT and on
-- the re-add UPDATE (add_shift back to true). Drops leave it as the last
-- signup time. First minimal slice toward #620 (flags -> timestamps + SCD log).
ALTER TABLE op_volunteer_shifts ADD COLUMN signed_up_at DATETIME NULL;
