-- Bounced email addresses (#785): a place to record that a volunteer's email
-- bounces, so we stop sending to it.
--
-- op_email_queue.state='sent' only means the SMTP server accepted the message;
-- the bounce that comes back later is never read. This column is the manual
-- record of it.
--
--   email_bounced_at - NULL = address is fine. Set (by an admin on the account
--                      page) = the mail worker marks any queued mail to that
--                      address `dead` instead of sending. Cleared automatically
--                      whenever the volunteer's email changes.
--
-- No actor column on purpose: who set it rolls into the SCD2 log (#620).

ALTER TABLE op_volunteers
  ADD COLUMN email_bounced_at DATETIME NULL AFTER email;
