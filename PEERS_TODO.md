# PEERS Customization TODO — Census-specific items to own/replace/remove

Tracking list of everything still Census-specific that PEERS must provide their own
version of, remove, or confirm. Created 2026-06-23 from a full codebase audit at Mew's
request. **Check items off (`[x]`) as they're done so nothing gets lost.**

Legend: ☐ = todo · ✅ = done · ❓ = needs a PEERS decision · 📄 = provide content/value

---

## 1. Return / contact email addresses  📄
- [x] `CONTACT_RECIPIENTS` → replaced with single `CONTACT_RECIPIENT = "peers@burningman.org"` (`client/src/constants.ts`). Contact "To" field is now prepopulated + read-only; form routes only to `peers@burningman.org`. (commit `6444bbc`, deployed to prod 2026-06-30)
- [x] `VC_LIST_EMAIL` — `client/src/components/api/shiftVolunteers.ts` — critical-drop alerts now go to BOTH `peers@burningman.org` and `peers-coordinators@burningman.org` (array `VC_LIST_EMAILS`, joinAddrs comma-list). Was `censusvolunteercoordinators@burningman.org`. (papabear 2026-07-16 email audit). ⚠️ `peers-coordinators@burningman.org` must exist as a real alias/list before go-live (when MAIL_OVERRIDE_TO is lifted).
- [x] Contact-form CC — removed (`client/src/pages/api/contact/index.ts`). Contact form now sends with no Cc. (commit `6444bbc`)
- [x] `MAIL_FROM` — default changed to `peers@burningmail.burningman.org` (`client/lib/mail/index.ts`). Uses the SES-verified `burningmail.burningman.org` subdomain (apex `burningman.org` not a confirmed SES identity). (commit `802673e`, deployed to prod 2026-06-30)
- [x] `MAIL_DEFAULT_REPLY_TO` — default changed to `PEERS Volunteer Coordinators <peers@burningman.org>` (`client/lib/mail/index.ts:13-15`). Was `censusvc@burningman.org`; prod has no env override so the code default applies. (papabear 2026-07-16, caught via test email)
- [x] Calendar UID domain — changed `@volunteers.census.burningman.org` → `@volunteers.peers.burningman.org` (2026-07-17). It's an iCalendar UID namespace only (not email/DNS), safe to change pre-invites.
- [x] BS-doc emails — the entire Methods/Communication section (and its personal emails) was removed in the 2026-07-16 BS rewrite. No emails remain in the doc.
- [x] Home page `mailto:` — `client/src/app/Home.tsx` — confirmed `peers@burningman.org` (in source + live). (2026-07-01)
- [x] `APP_BASE_URL` — set correctly in prod `.env.production` (`https://volunteers.peers.burningman.org`). *(Code fallbacks in queue.ts/assignmentNotify.ts/shiftVolunteers.ts still say census — harmless since env overrides; optional cleanup.)*

## 2. Reports listing  📄
- [x] Census population report listing **removed**; Reports page is now an admin-only **PPP CSV audit export**, and the Reports nav entry is hidden from non-admins (2026-07-17).

## 3. Hero/banner images & brand assets  📄
- [x] Banners (2026-07-17): deleted the census `databeast-volunteers-*` / `desk-*` + unused `storage.jpg`; repointed the 3 pages that used them (Role-volunteers→volunteers-greeting, Shift-volunteers→peers-footwash, Account-create→city-aerial-day). Remaining unused generic BM banners (camp-at-day/night, flags, man-at-night) left available. papabear can request different images per page anytime.
- [x] Favicon — confirmed correct PEERS badge (papabear 2026-07-17).
- [x] Help screenshots — replaced with papabear's current PEERS captures, live on the Help page (2026-07-17).
- [x] Logo (`logo-peers.png`/`logo-header.svg`), page titles, home-page copy/mission — already PEERS.

## 4. Behavioral Standards document  📄
- [x] Leadership roster + emails — removed entirely in the 2026-07-16 BS rewrite (Random/Rescue/Captain Mew names + random@/ann.norton@/mu@ aliases are gone; page no longer lists individuals).
- [x] Coordinator email — `BehavioralStandards.tsx` "should be sent to" address changed `censusvolunteercoordinators@` → `peers@burningman.org`. (papabear 2026-07-16)
- [x] Body policy text — replaced with the finalized standardized Burning Man Behavioral Standards Agreement copy (papabear-supplied Google Doc, 2026-07-16).

## 5. Volunteer flow — SAP / CSP / training-first  ❓ (decisions, then code/data)
- [x] **SAP** (early-entry "Setup/Special Access Pass"): **volunteer-facing request path DISABLED in prod** (commit `048cdc7`, per papabear 2026-07-01; confirmed by Mew 2026-07-02 — "PEERS doesn't need it"). Removed the On-Playa/Early-Entry/SAP card + arrival-date/other-sap/location handlers from `VolunteerInfo.tsx`, plus the "plans" checklist item. Volunteers can no longer set a pre-open arrival date or request early entry, so the SAP-requirements checklist block (`isPreOpen` gated) is now dormant/unreachable. **Still present (not removed):** admin "SAP issued" download item, the `op_saps`/`other-sap`/`sap/[sapId]` API routes, and role-threshold CSP logic — remove those separately if a full teardown is wanted.
- [x] **CSP → PPP** (2026-07-17): rebranded "SAP points"/"CSP" to **PEERS Participation Points**, hidden from participants, admin-only CSV audit report. Squaddie=3/Lead=6 (already correct on prod). The 12-CSP / role-threshold early-entry logic was removed with the SAP mechanic.
- [x] **Training-first shift gating LIVE** (2026-07-17): on `/shifts`, shifts a volunteer lacks the matching PEERS access role for are grayed out + non-clickable (role granted via the Hive confirmation link). ⚠️ Still **UI-side only** — server-side signup enforcement remains open (see §9 hardening).
- [x] `ROLE_DISPLAY_NAMES` — pruned to just `BurnerProfileUpdated`; the census camp/ticket/SAP/training-complete labels (for now-deleted roles) removed (2026-07-17). Also removed the **dormant training-checklist block** from VolunteerInfo (never rendered — no `op_position_trainings` links).
- [x] The 5 Census training courses (Census Basics / Random Sampling / OutReach / DataEntry Wiz / DataBeast Driver) **soft-deleted from prod** 2026-07-17 along with their roles; only Peers Lead/Squaddie trainings remain active. (Their real Hive URLs still tracked in §7.)
- [x] Event datenames — `PRE_OPEN_DATENAMES` **removed** from `VolunteerInfo.tsx` in the 2026-07-17 SAP teardown. `DAY_REQS` in `info/index.ts` still present but fully dormant (SAP gone).

## 6. Physical playa address  📄
- [x] `assignmentNotify.ts:152` (.ics LOCATION) & `:225` (email body) — set to **PEERS Lab, Esplanade & 5:45, Black Rock City** (per stickybeak, 2026-07-09). Was Census's "6:30 & A".
- [x] `BehavioralStandards.tsx` — no street address here; only generic "PEERS Lab" location-name mentions (lines 307/310), which are correct. Nothing to change.

## 7. Places I was guessing — need confirmation  ❓
- [x] GetInvolved sidebar links — `GetInvolved.tsx` reworked (048cdc7, per papabear 2026-07-01): removed the Discord + Volunteer-year-round placeholder cards; the remaining card is "Explore PEERS & camp resources" with real links (Camp Resource Guide, The Placement Process). "Take Fun with Fulcrum" URL supplied by papabear 2026-07-16 (`https://hive.burningman.org/share/LE7a4J-96g3hYQ15`) → now a live link.
- [x] Lead/Squaddie "hive" course URLs (2026-07-17): Squaddie (`ZNRCZ`) → `https://hive.burningman.org/spaces/24147649?utm_source=manual` (papabear). Lead (`AYWOF`) url **cleared** — Lead training is invite-only, sent via email; the course URL isn't needed on the site (role still granted by the confirmation link). Note: `op_trainings.url` currently surfaces nowhere anyway (the only consumer was the now-removed dormant training checklist).
- [x] Role names confirmed final by papabear (2026-07-17): `PEERS Lead` / `PEERS Squaddie` / `PEERS Coordinator`. (Also: legacy census roles cleaned up — only 8 keeper roles remain active in prod.)
- [ ] Repo destination for `peers-main` (currently pushed to `mbhewitt/CensusScheduler`; new `PeersScheduler` repo eventually?).
- [ ] Backup strategy: add git-versioned snapshots like census? (currently 4-hourly disk dumps + RDS daily snapshots; no git repo chosen.)

## 9. On-playa walk-in signup + passcode gating  (B passcode-IP-gating ✅ DONE 2026-07-17; A walk-in role still open)
Design agreed in #peers 2026-07-03. Two linked pieces — B (passcode IP gating) is
live; A (walk-in NewVolunteer role/shifts) remains:

**A. Reserve walk-in shifts via a `NewVolunteer` role** (Mew's design):
- [ ] Add `NewVolunteer` role to `op_roles` (e.g. id `2000103`, matching Lead `2000101` / Squaddie `2000102`).
- [ ] Auto-grant `NewVolunteer` on self-signup — extra INSERT into `op_volunteer_roles` in the account-creation API (`client/src/pages/api/volunteers/account/index.ts`, currently inserts with empty roleList). **Only for on-playa signups** (else pre-event online self-registrants get it too) → gated by the IP check in B.
- [ ] Create the walk-in "squaddie shifts" with the position's `role_id = NewVolunteer`. Reserves those slots for walk-ins; pre-event folks (HIVE → Lead/Squaddie, not NewVolunteer) are excluded → forced into trained shifts.
- [ ] **Harden:** shift-signup role check is **client-side only** — the add-to-shift POST (`client/src/pages/api/shifts/[timeId]/volunteers/index.ts`) does NOT re-verify `role_id`/`prerequisite_id`. Add server-side role enforcement so the reservation isn't bypassable by a forged request.

**B. Passcode sign-in on playa, gated by IP — ✅ DONE, live on prod 2026-07-17 (`af05388`):**
- [x] Replaced the build-time `NEXT_PUBLIC_PIN_ENABLED` flag with a **per-request** decision.
- [x] Middleware reads the client IP and marks on-playa if in the playa CIDR (`162.212.150.0/23`, env-overridable via `PEERS_ONPLAYA_CIDR`), sets a readable `peers-on-playa` cookie; UI (Home/Sign-in/Header/VolunteerInfo) reads it via `useIsOnPlaya`; `/api/sign-in` **re-verifies the IP server-side** before honoring a passcode.
- [x] Mew provided (a) the CIDR = `162.212.150.0/23`; (b) confirmed no CDN — prod is bare nginx which sets the unspoofable **`X-Real-IP`** (what we key off). See [[reference_onplaya_passcode_gating]].
- Off-playa = Okta-only (unchanged); on-playa = passcode + Okta + open walk-up `/shifts`. Dormant until devices are on the playa net.

## 8. Ops / infra files (found in reviewer pass 2026-06-24)  📄
- [x] `httpd/public-html/index.html` — fallback redirect repointed `census.org:3000` → `https://volunteers.peers.burningman.org` (2026-07-17). (Unused this year — cloud-only playa — but tidied.)
- [x] `Tablet_setup.md` — **deleted** (2026-07-17, papabear): it's a Census kiosk-provisioning process PEERS doesn't use (playa is cloud-only; tablets just open the cloud app). No PEERS tablet Google account exists / is needed.
- [x] `database/scheduler_schema.sql:4` — `-- Database: census` dump-header comment: cosmetic metadata, leave as-is.

## Go-live flip (do together when ready)
- [x] Lift `MAIL_OVERRIDE_TO` — **DONE 2026-07-17** (Mew's go): commented it in prod `client/.env.production` (backup saved) and **rebuilt** (it's build-time inlined, so a restart alone wasn't enough). Mail worker now runs with no override → real recipients. Reverse = uncomment + rebuild.
- [x] Contact form From (`peers@burningmail.burningman.org`) + recipient (`peers@burningman.org`) set. *(General `MAIL_DEFAULT_REPLY_TO` default still §1.)*
- [ ] Confirm playa address, reports, images, BS roster all finalized first.

## Parked / nice-to-have
- [ ] **Training-completion audit report** (papabear parked 2026-07-19): honor-system access, but a post-event way to catch anyone handed the HIVE confirmation link who skipped training. No universal ID (HIVE uses a "Token" ≠ Okta `sub` ≠ Salesforce BPGUID), so match by **email**: HIVE-completion email ↔ PEERS scheduler email (= Burner-Profile/Okta email; watch the burner-vs-@burningman mismatch). I offered to export the scheduler side (everyone holding the Squaddie/Lead access role + name + email = who "completed" per the link click) and/or build a "has-access-role but no HIVE-completion match" report next to the PPP report. **Build when they have a HIVE completion export to diff against.**
- [x] **Shift scheduling rules** (papabear 2026-07-21, final on prod `b1b65eb`): three server-side guards in `src/pages/api/shifts/[timeId]/volunteers/index.ts` POST, all exempting Coordinators (PCIO/PCOC, role 95209):
  1. **Cross-type overlap** — a Squaddie and a Shift Lead shift can't overlap by **>60 min** (`9b58f07`).
  2. **No 3 consecutive** — at most two consecutive shifts, **type-agnostic** (Squaddie+Lead chained together). "Consecutive" = overlap ≤60 min OR gap ≤60 min; a **60-min break still counts as consecutive** (the day's slots are spaced with up to 60-min breaks). Shipped per-type `bf0e10a` → type-agnostic `04eb7ea` → 60-min gap fix `d7bf962`.
  3. **Daily cap** — at most **3 non-Coordinator shifts per day** (`dab6acb`).
  - Allowed: hold slots 1,2,4 or 1,3,4. Blocked: 1‑2‑3, 2‑3‑4, or a 4th same-day shift. Rule logic unit-tested against all of papabear's stated cases.
- [x] **Self-service Drop Shift button** (papabear 2026-07-21, shipped `30dfe21`+`b1b65eb`): on the Shift Volunteers page, a "Drop Shift" button (person-minus icon) left of "Claim Shift", shown only when the current user is signed up for that shift. Reuses the remove-confirmation dialog, which now shows self-drop wording ("Drop Shift / drop your <position> on <date>, <time>?") when removing yourself and the original "Remove volunteer" wording when an admin removes someone else.
- [x] **SQUAD / LEAD shift badges** (papabear 2026-07-21, shipped to prod `739b189`): arched wordmark PNGs matching the PEERS patch font (Alfa Slab One) — **SQUAD arcs up, LEAD arcs down** (distinct) — shown on the shift calendars (middle-right of the box) and tables (end of Type/Position cell) via `client/src/utils/shiftBadge.ts` (Squaddie→SQUAD, Lead→LEAD, Coordinator→none). Was parked on a `peers-badges` branch for team feedback, then un-parked to prod (revert-the-revert of `de063bf` + the LEAD-down update); `peers-badges` branch deleted, staging back on peers-main.
- [x] **Redacted Help check-in screenshots** (papabear 2026-07-21, prod `41db3f5`): blacked out the World name values in `public/help/check-in-{1,2}-v2.png` (kept the header); renamed with `-v2` suffix as a cache-bust (a `?v=` query broke the Next image loader).

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
