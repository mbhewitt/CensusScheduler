Copies of the older reports from the Census Report Archive
(https://github.com/BRC-Census/reports, `public/`), bundled so they work
offline on playa (#755). 2022-2025 live one folder up.

Changes from the archive copy, so it works inside the app's report dialog:
- `href="../"` Back links → `href="/reports" target="_top"`
- `../2016-population-analysis/` → `../2016-population-analysis/index.html`
  (Next.js doesn't serve a folder's index.html)
- `patch.js`: Back goes to `/reports`, `target="_top"`

Plain git, not LFS like client/public/training: prod has no git-lfs, so LFS
files ship there as 131-byte pointer stubs.
