# PEERS Customization TODO — Census-specific items to own/replace/remove

Tracking list of everything still Census-specific that PEERS must provide their own
version of, remove, or confirm. Created 2026-06-23 from a full codebase audit at Mew's
request. **Check items off (`[x]`) as they're done so nothing gets lost.**

Legend: ☐ = todo · ✅ = done · ❓ = needs a PEERS decision · 📄 = provide content/value

---

## 1. Return / contact email addresses  📄
- [x] `CONTACT_RECIPIENTS` → replaced with single `CONTACT_RECIPIENT = "peers@burningman.org"` (`client/src/constants.ts`). Contact "To" field is now prepopulated + read-only; form routes only to `peers@burningman.org`. (commit `6444bbc`, deployed to prod 2026-06-30)
- [ ] `VC_LIST_EMAIL` — `client/src/components/api/shiftVolunteers.ts:19` — `censusvolunteercoordinators@burningman.org` (critical-drop alerts).
- [x] Contact-form CC — removed (`client/src/pages/api/contact/index.ts`). Contact form now sends with no Cc. (commit `6444bbc`)
- [x] `MAIL_FROM` — default changed to `peers@burningmail.burningman.org` (`client/lib/mail/index.ts`). Uses the SES-verified `burningmail.burningman.org` subdomain (apex `burningman.org` not a confirmed SES identity). (commit `802673e`, deployed to prod 2026-06-30)
- [x] `MAIL_DEFAULT_REPLY_TO` — default changed to `PEERS Volunteer Coordinators <peers@burningman.org>` (`client/lib/mail/index.ts:13-15`). Was `censusvc@burningman.org`; prod has no env override so the code default applies. (papabear 2026-07-16, caught via test email)
- [ ] Calendar UID domain — `client/src/components/api/assignmentNotify.ts:165` — `@volunteers.census.burningman.org` (keep stable; pick PEERS domain).
- [ ] BS-doc emails — `BehavioralStandards.tsx:265,291,295-296` (see §4).
- [x] Home page `mailto:` — `client/src/app/Home.tsx` — confirmed `peers@burningman.org` (in source + live). (2026-07-01)
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
- [x] **SAP** (early-entry "Setup/Special Access Pass"): **volunteer-facing request path DISABLED in prod** (commit `048cdc7`, per papabear 2026-07-01; confirmed by Mew 2026-07-02 — "PEERS doesn't need it"). Removed the On-Playa/Early-Entry/SAP card + arrival-date/other-sap/location handlers from `VolunteerInfo.tsx`, plus the "plans" checklist item. Volunteers can no longer set a pre-open arrival date or request early entry, so the SAP-requirements checklist block (`isPreOpen` gated) is now dormant/unreachable. **Still present (not removed):** admin "SAP issued" download item, the `op_saps`/`other-sap`/`sap/[sapId]` API routes, and role-threshold CSP logic — remove those separately if a full teardown is wanted.
- [ ] **CSP** ("SAP points" scoring): keep/rebrand/remove. Label "SAP points" in shift-position dialogs; `requiredCsp=12` in `info/index.ts:256`; role thresholds via `op_roles.census_shift_points`.
- [ ] **Training-first** (per Mew 2026-06-23): **use the existing role gate — no new mechanism.** Volunteer earns a "training completed" role via a training-confirmation hive link, and that role is set as the position's required Role (`op_position_type.role_id`) → can't sign up until trained (same pattern as Lead/Squaddie). Setup is **data only** (create training role + hive link + set the position's role). ⚠️ Note: the position-role gate is currently **UI-side only** (`ShiftVolunteersDialogAdd.tsx`); the signup API doesn't enforce it server-side — only harden there if strict enforcement is wanted.
- [ ] `ROLE_DISPLAY_NAMES` — `VolunteerInfo.tsx:93-104` — training/role labels (some still Census-flavored).
- [ ] Training curriculum/URLs — `op_trainings` (5 seed Census trainings) carry Census course links: Hive posts for Census Basics/Random Sampling/OutReach/DataBeast (`database/scheduler_schema.sql:379-383`, and live in prod/test DBs) **and a Census Google-Drive doc for "DataEntry Wiz"** (`scheduler_schema.sql:382`). Replace with PEERS courses or remove. (Lead/Squaddie hive URLs tracked in §7.)
- [ ] Event datenames — `ARRIVAL_DATENAMES` was removed from `VolunteerInfo.tsx` with the On-Playa card (048cdc7); `PRE_OPEN_DATENAMES` still there (feeds the now-dormant `isPreOpen` gate) + `DAY_REQS` (`info/index.ts:15-33`) — only matters if SAP kept.

## 6. Physical playa address  📄
- [x] `assignmentNotify.ts:152` (.ics LOCATION) & `:225` (email body) — set to **PEERS Lab, Esplanade & 5:45, Black Rock City** (per stickybeak, 2026-07-09). Was Census's "6:30 & A".
- [x] `BehavioralStandards.tsx` — no street address here; only generic "PEERS Lab" location-name mentions (lines 307/310), which are correct. Nothing to change.

## 7. Places I was guessing — need confirmation  ❓
- [x] GetInvolved sidebar links — `GetInvolved.tsx` reworked (048cdc7, per papabear 2026-07-01): removed the Discord + Volunteer-year-round placeholder cards; the remaining card is "Explore PEERS & camp resources" with real links (Camp Resource Guide, The Placement Process). "Take Fun with Fulcrum" URL supplied by papabear 2026-07-16 (`https://hive.burningman.org/share/LE7a4J-96g3hYQ15`) → now a live link.
- [ ] Lead/Squaddie "hive" course URLs — `op_trainings.url` for codes `AYWOF` (Lead) / `ZNRCZ` (Squaddie) are placeholder `hive.burningman.org`. Provide real course pages.
- [ ] Confirm final role names: `PEERS Lead` / `PEERS Squaddie` / `PEERS Coordinator` (team set these via admin UI — confirm they're final).
- [ ] Repo destination for `peers-main` (currently pushed to `mbhewitt/CensusScheduler`; new `PeersScheduler` repo eventually?).
- [ ] Backup strategy: add git-versioned snapshots like census? (currently 4-hourly disk dumps + RDS daily snapshots; no git repo chosen.)

## 9. On-playa walk-in signup + passcode gating  ❓ (parked — "work out before playa", Mew 2026-07-03)
Design agreed in #peers 2026-07-03; deferred to pre-playa. Two linked pieces:

**A. Reserve walk-in shifts via a `NewVolunteer` role** (Mew's design):
- [ ] Add `NewVolunteer` role to `op_roles` (e.g. id `2000103`, matching Lead `2000101` / Squaddie `2000102`).
- [ ] Auto-grant `NewVolunteer` on self-signup — extra INSERT into `op_volunteer_roles` in the account-creation API (`client/src/pages/api/volunteers/account/index.ts`, currently inserts with empty roleList). **Only for on-playa signups** (else pre-event online self-registrants get it too) → gated by the IP check in B.
- [ ] Create the walk-in "squaddie shifts" with the position's `role_id = NewVolunteer`. Reserves those slots for walk-ins; pre-event folks (HIVE → Lead/Squaddie, not NewVolunteer) are excluded → forced into trained shifts.
- [ ] **Harden:** shift-signup role check is **client-side only** — the add-to-shift POST (`client/src/pages/api/shifts/[timeId]/volunteers/index.ts`) does NOT re-verify `role_id`/`prerequisite_id`. Add server-side role enforcement so the reservation isn't bypassable by a forged request.

**B. Passcode sign-in on playa, gated by IP** (Okta unreliable on playa; single prod host serves both pre-event Okta + on-playa passcode):
- [ ] Blocker: passcode mode is a **build-time, all-or-nothing** flag `NEXT_PUBLIC_PIN_ENABLED` (inlined into the static bundle; `NEXT_PUBLIC_*`). Can't vary per request. Controls the passcode UI (Home/Sign-in/Header), middleware walk-up routes (`/shifts`), and `/api/sign-in`.
- [ ] Move decision build-time → runtime: (1) **middleware** reads client IP (`x-forwarded-for`), marks request on-playa (cookie/header) if in playa range; (2) **UI** reads that runtime signal instead of the inlined flag (several components hard-read `NEXT_PUBLIC_PIN_ENABLED`); (3) **`/api/sign-in` server enforcement** — only honor a passcode when request IP is in the playa range (currently the env flag is the only gate → anyone worldwide could passcode-login).
- [ ] **Need from Mew:** (a) the playa **egress IP / CIDR** (BM uplink NAT range) = the allowlist; (b) whether prod is behind a **proxy/CDN** (Cloudflare/nginx) → which header carries the real client IP.
- [ ] Alt if hard IP range is messy: staff-entered on-playa access code, or an admin toggle enabling passcode mode for the event window (simpler, less bulletproof than IP).

## 8. Ops / infra files (found in reviewer pass 2026-06-24)  📄
- [ ] `httpd/public-html/index.html:5,7,13` — on-playa fallback redirect hardcodes `http://census.org:3000` (meta refresh + JS + link). Point at the PEERS app or remove. (Not used by the prod EC2/nginx stack, but ships in the repo / on-playa boxes.)
- [ ] `Tablet_setup.md:15` — tablet Google account `brccensus.labhost@gmail.com` (Census-branded). Confirm/replace for PEERS tablets.
- [ ] `Tablet_setup.md:19` — "click on census logo" instruction → PEERS logo.
- [x] `database/scheduler_schema.sql:4` — `-- Database: census` dump-header comment: cosmetic metadata, leave as-is.

## Go-live flip (do together when ready)
- [ ] Lift `MAIL_OVERRIDE_TO` (currently routes all mail to papabear@burningman.org).
- [x] Contact form From (`peers@burningmail.burningman.org`) + recipient (`peers@burningman.org`) set. *(General `MAIL_DEFAULT_REPLY_TO` default still §1.)*
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
- [x] **Contact form finalized (2026-06-30):** single recipient `peers@burningman.org` via read-only prepopulated "To" field, no Cc, "reply wanted" checkbox + text removed, From `peers@burningmail.burningman.org`. Live on prod; real test email verified delivered to the Salesforce Service Cloud go-live inbox. (commits `6444bbc`/`87ce309`/`802673e`)
