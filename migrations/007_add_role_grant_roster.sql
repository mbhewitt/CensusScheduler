-- Migration: roles-on-login roster (per Mew 2026-06-22).
--
-- A small authoritative roster of camp/staff roles keyed by email. On login,
-- the Okta callback looks the volunteer up by email and grants any roles listed
-- here that they don't already hold (ADDITIVE only — it never removes a role).
-- This is the "roles on first login" facility for the camp roster (Census Lab,
-- Counter Culture, Staff): people who haven't logged into the app yet — and so
-- can't have op_volunteer_roles rows (FK to op_volunteers) — get their role the
-- moment they first sign in. Same spirit as the sampler-role recommendation in
-- census-python, but keyed to a manual roster instead of shift history.
--
-- To add someone for a future roster: INSERT a (LOWER(email), role_id) row.
-- role_id: 2000009 = CensusLabCamp, 2000008 = CounterCultureCamp, 2000006 = Staff.
--
-- Run-once create; the seed is idempotent (INSERT IGNORE on the PK).

CREATE TABLE IF NOT EXISTS op_role_grant_roster (
  email   VARCHAR(255) NOT NULL,
  role_id BIGINT       NOT NULL,
  PRIMARY KEY (email, role_id)
);

INSERT IGNORE INTO op_role_grant_roster (email, role_id) VALUES
  ('aaronshev@gmail.com', 2000006),
  ('alekchakroff@gmail.com', 2000006),
  ('alekchakroff@gmail.com', 2000009),
  ('amylie9@gmail.com', 2000006),
  ('amylie9@gmail.com', 2000009),
  ('andi.morency@burningman.org', 2000006),
  ('andi.morency@burningman.org', 2000009),
  ('ann976norton@gmail.com', 2000006),
  ('ann976norton@gmail.com', 2000008),
  ('beaulieu-prevost.dominic@uqam.ca', 2000006),
  ('chipper@burningman.org', 2000006),
  ('cinnamonbm2008@burningman.org', 2000006),
  ('davechristiansen@outlook.com', 2000008),
  ('ehannigan@me.com', 2000008),
  ('eric.bahn@gmail.com', 2000009),
  ('evansonearth@gmail.com', 2000008),
  ('heathermessal@gmail.com', 2000009),
  ('hunterinnewyorkcity@gmail.com', 2000008),
  ('jaiden0@hotmail.com', 2000009),
  ('jeremiah.conley@yahoo.com', 2000006),
  ('jeremiah.conley@yahoo.com', 2000009),
  ('jimstamper@mail.com', 2000008),
  ('laurameisenegreen@gmail.com', 2000008),
  ('meredithkb@yahoo.com', 2000006),
  ('mu@burningman.org', 2000006),
  ('mu@burningman.org', 2000008),
  ('mx.weking@gmail.com', 2000006),
  ('mx.weking@gmail.com', 2000009),
  ('natreid013@gmail.com', 2000008),
  ('random@burningman.org', 2000006),
  ('random@burningman.org', 2000009),
  ('raratan@gmail.com', 2000009),
  ('rkohara@gmail.com', 2000009),
  ('robertbunsold@gmail.com', 2000008),
  ('rqreyes@gmail.com', 2000006),
  ('rqreyes@gmail.com', 2000008),
  ('sd12@cornell.edu', 2000009),
  ('sdurkee@mac.com', 2000008),
  ('ssloan.cnm@gmail.com', 2000008),
  ('surge16@msn.com', 2000006),
  ('surge16@msn.com', 2000009),
  ('vernon.andrews76@gmail.com', 2000008),
  ('victoriaprimeau@gmail.com', 2000006),
  ('victoriaprimeau@gmail.com', 2000009),
  ('welcome2planetshan@gmail.com', 2000008),
  ('woodie@netpress.com', 2000006),
  ('woodie@netpress.com', 2000009);
