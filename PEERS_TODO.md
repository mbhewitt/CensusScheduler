# PEERS Customization TODO — Census-specific items to own/replace/remove

Tracking list of everything still Census-specific that PEERS must provide their own
version of, remove, or confirm. Created 2026-06-23 from a full codebase audit at Mew's
request. **Check items off (`[x]`) as they're done so nothing gets lost.**

Legend: ☐ = todo · ✅ = done · ❓ = needs a PEERS decision · 📄 = provide content/value

---

## 1. Return / contact email addresses  📄
- [ ] `CONTACT_RECIPIENTS` — `client/src/constants.ts:14-19` — 4 categories still Census addrs (`censusvolunteercoordinators@`, `ann.norton@`, `random@`, `aaron.shev@`, `mu@`, `chipper@`, `rqreyes@gmail.com`). Provide PEERS recipients per category.
- [ ] `VC_LIST_EMAIL` — `client/src/components/api/shiftVolunteers.ts:19` — `censusvolunteercoordinators@burningman.org` (critical-drop alerts).
- [ ] Contact-form CC — `client/src/pages/api/contact/index.ts:68` — `censusvc@burningman.org`.
- [ ] `MAIL_FROM` — default `census@burningmail.burningman.org` (`client/lib/mail/index.ts:12`). Set the env var to a PEERS sender (SES relays as `burningmail.burningman.org`).
- [ ] `MAIL_DEFAULT_REPLY_TO` — default `... <censusvc@burningman.org>` (`client/lib/mail/index.ts:13-15`).
- [ ] Calendar UID domain — `client/src/components/api/assignmentNotify.ts:165` — `@volunteers.census.burningman.org` (keep stable; pick PEERS domain).
- [ ] BS-doc emails — `BehavioralStandards.tsx:265,291,295-296` (see §4).
- [ ] Home page `mailto:` — `client/src/app/Home.tsx:158` — `peers@burningman.org` (confirm it's right).
- [x] `APP_BASE_URL` — set correctly in prod `.env.production` (`https://volunteers.peers.burningman.org`). *(Code fallbacks in queue.ts/assignmentNotify.ts/shiftVolunteers.ts still say census — harmless since env overrides; optional cleanup.)*

## 2. Reports listing  📄
- [ ] `client/src/app/reports/Reports.tsx:20,25,30` — three "Black Rock City Census 20XX Population Report" entries (link to `/reports/<year>/index.html`). Provide PEERS reports or remove the listing.

## 3. Hero/banner images & brand assets  📄
- [ ] Review/replace banners in `client/public/banners/` — esp. `databeast-volunteers-*.jpg`, `desk-*.jpg` (may show Census volunteers/branding). `Home.tsx:50` uses `camp-at-day.jpg`.
- [ ] Verify `client/public/general/favicon.ico` is the PEERS badge.
- [ ] Review help screenshots `client/public/help/*.jpg` for Census-era tablet UI.
- [x] Logo (`logo-peers.png`/`logo-header.svg`), page titles, home-page copy/mission — already PEERS.

## 4. Behavioral Standards document  📄
- [ ] Leadership roster + emails — `BehavioralStandards.tsx:290-299` ("As of Jun 2026..." names/aliases). Confirm current PEERS leadership + addresses.
- [ ] Coordinator email — `BehavioralStandards.tsx:265` (`censusvolunteercoordinators@`).
- [ ] Confirm body policy text is PEERS-correct (already rebranded to "BRC PEERS"; just confirm content/expectations).

## 5. Volunteer flow — SAP / CSP / training-first  ❓ (decisions, then code/data)
- [ ] **SAP** (early-entry "Setup/Special Access Pass" + 12-point requirement): keep, rebrand, or **disable**? If disable: hide UI in `VolunteerInfo.tsx` (~480-502, 646-708, 900-935) and remove `op_saps`/`other-sap`/`sap/[sapId]` paths. Mew said "flow **without** SAP" → likely disable.
- [ ] **CSP** ("SAP points" scoring): keep/rebrand/remove. Label "SAP points" in shift-position dialogs; `requiredCsp=12` in `info/index.ts:256`; role thresholds via `op_roles.census_shift_points`.
- [ ] **Training-first**: today training is *optional* (shown, not gated). Mew wants "**training first**" → add a signup gate (block shift signup until required trainings done) in `/api/shifts/[timeId]/volunteers` + reorder checklist in `VolunteerInfo.tsx:549-608`. **Needs code change.**
- [ ] `ROLE_DISPLAY_NAMES` — `VolunteerInfo.tsx:93-104` — training/role labels (some still Census-flavored).
- [ ] Training curriculum/URLs — `op_trainings` (the 5 seed Census trainings + Hive URLs). Define PEERS trainings.
- [ ] Event datenames — `ARRIVAL_DATENAMES`/`PRE_OPEN_DATENAMES` (`VolunteerInfo.tsx:71-90,122-133`) + `DAY_REQS` (`info/index.ts:15-33`) — only matters if SAP kept.

## 6. Physical playa address  📄
- [ ] `assignmentNotify.ts:152` (.ics LOCATION) & `:225` (email body) — "PEERS Lab, **6:30 & A**, Black Rock City". 6:30&A is **Census's** spot — provide PEERS's real Placement address.
- [ ] Same address/location references in `BehavioralStandards.tsx`.

## 7. Places I was guessing — need confirmation  ❓
- [ ] GetInvolved sidebar links — `client/src/app/volunteers/[shiftboardId]/info/GetInvolved.tsx:19-41` — all `href="#"` placeholders. Provide PEERS Discord invite / year-round group / Hive space URLs (or remove the sidebar).
- [ ] Lead/Squaddie "hive" course URLs — `op_trainings.url` for codes `AYWOF` (Lead) / `ZNRCZ` (Squaddie) are placeholder `hive.burningman.org`. Provide real course pages.
- [ ] Confirm final role names: `PEERS Lead` / `PEERS Squaddie` / `PEERS Coordinator` (team set these via admin UI — confirm they're final).
- [ ] Repo destination for `peers-main` (currently pushed to `mbhewitt/CensusScheduler`; new `PeersScheduler` repo eventually?).
- [ ] Backup strategy: add git-versioned snapshots like census? (currently 4-hourly disk dumps + RDS daily snapshots; no git repo chosen.)

## Go-live flip (do together when ready)
- [ ] Lift `MAIL_OVERRIDE_TO` (currently routes all mail to Mew's gmail).
- [ ] Set `MAIL_FROM` + real `CONTACT_RECIPIENTS`/reply-to.
- [ ] Confirm playa address, reports, images, BS roster all finalized first.

---

## Already completed (reference)
- [x] Census→PEERS rebrand sweep (UI copy, palette, logo, page titles)
- [x] Dates updated to 2026
- [x] Shift taxonomy collapsed to single "Peers" dept/category/type/position
- [x] PEERS Lead/Squaddie/Coordinator roles + Lead/Squaddie hive-confirmation links
- [x] Prod deployed (`volunteers.peers.burningman.org`): EC2, DNS, TLS, Okta, RDS, backups
- [x] Email pipeline verified working (exim → AWS SES); test message delivered
- [x] Upstream merge: 10 census-main commits incl. the `/api/volunteers/[id]/*` security gate
