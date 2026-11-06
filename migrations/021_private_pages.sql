-- Super-admin private pages: self-contained HTML pages that a server-side job
-- generates and stores here, served only to super admins at
-- /api/private-pages/<name>. The content never lives in this (public) repo, so
-- internal-only material can be shown in the app without being published.
--
--   name        - URL slug, [a-z0-9-] only (checked by the API).
--   html        - the whole page, one self-contained document.
--   updated_at  - when the job last wrote it.

CREATE TABLE IF NOT EXISTS op_private_pages (
  name        VARCHAR(64) NOT NULL PRIMARY KEY,
  html        MEDIUMTEXT NOT NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
