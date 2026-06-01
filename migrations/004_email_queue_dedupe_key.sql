-- Adds dedupe_key to op_email_queue so an enqueueing producer can
-- collapse its own already-queued-but-not-yet-sent rows. See #391.
--
-- Use case (initial): a volunteer adds themselves to a shift, then
-- removes themselves before the "assignment" email has actually been
-- sent. Both rows can be collapsed — no inbox noise for a state that
-- resolved itself. If the assignment already sent, the removal still
-- needs to ship so the volunteer's calendar drops the event.
--
-- Convention for assignment/removal dedupe_key:
--   `${shiftboard_id}:${time_position_id}`
-- (Generic free-form string; future callers can pick their own format
-- as long as both sides of a pair use the same value.)
--
-- Idempotent: safe to re-run.

ALTER TABLE `op_email_queue`
  ADD COLUMN IF NOT EXISTS `dedupe_key` VARCHAR(128) NULL AFTER `category`;

-- Index to make the lookup-and-supersede path cheap. Includes state so
-- we only scan queued rows.
ALTER TABLE `op_email_queue`
  ADD KEY IF NOT EXISTS `idx_dedupe_state` (`dedupe_key`, `state`);
