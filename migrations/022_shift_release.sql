-- Shift release date (#869, Mew 2026-11-28): shifts dated on or after
-- embargo_from stay hidden from non-admins (and can't be signed up for) until
-- release_at, Pacific wall clock like every other app time. One row per
-- season; set on the Dates page. Off-playa shift types (meetings) are exempt.
-- announced_at is stamped when the release announcement (Discord + the
-- mailing list) goes out, so it goes out once.
CREATE TABLE IF NOT EXISTS op_shift_release (
  release_id INT NOT NULL AUTO_INCREMENT,
  embargo_from DATE NOT NULL,
  release_at DATETIME NOT NULL,
  announced_at DATETIME NULL,
  PRIMARY KEY (release_id)
);
