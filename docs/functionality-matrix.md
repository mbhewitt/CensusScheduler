# Census Scheduler — System Functionality Matrix

**Purpose.** A complete, code-derived inventory of what the app does — every
process × user tier × access context — built as the shared blueprint for the
help documentation effort: the redone on-playa manual and the web Help
build-out both draw from this. Derived from the codebase (not the old manual),
so it surfaces functionality that predates the 2025 manual and was never
written up.

**How to read it.** The grid lives in [`functionality-matrix.csv`](./functionality-matrix.csv)
(open as a spreadsheet or drop into NotebookLM). This document adds the prose
the grid can't hold: how the tiers/roles/gates actually work, plus the gap
analysis and the doc split.

Cell legend: `✓` can do · `self` own record only · `window` only in the
check-in window · `playa` on-playa only · `—` cannot / N/A.

---

## 1. User tiers

Tier is decided by the HMAC-signed `census-session` cookie plus role membership
(`op_volunteer_roles` × `op_roles`).

| Tier | How it's determined | Broadly can… |
|---|---|---|
| **Unauthenticated** | No valid session cookie | Sign in, create an account, contact, reports, help; on-playa also browse shifts |
| **Volunteer** | Valid session, no admin role | Everything about *their own* record: profile, checklist, shift signup, CSP/SAP |
| **Admin** | Holds role_id **2** | Act on *any* volunteer: roster, profiles, roles, check-in, review |
| **Super admin** | Holds role_id **1** | All config: dates, categories, positions, shift types, and the SAP pool |

Three enforcement layers: **middleware** (allowlist + cookie presence, redirects
to `/sign-in`) → **API** (`withAuth` / `withSuperAdmin` wrappers) → **client**
(`<AuthGate>` per page).

> ⚠️ **Known gap:** most admin/super-admin *config* write endpoints (roles,
> shift types/positions/categories, dates, behavioral-standards) are **page-gated
> only** — no server-side auth wrapper, so a direct API call bypasses the UI gate.
> Tracked as issue #535. Not volunteer-facing, but it belongs in the admin manual's
> "known limitations" and should be fixed.

## 2. Roles

Roles live in `op_roles` (read-only reference) and are assigned per volunteer in
`op_volunteer_roles` (with `add_role` / `remove_role` flags). Key ones:

| Role | ID | What it gates |
|---|---|---|
| Super Admin | 1 | SAP endpoints + super-admin pages |
| Admin | 2 | Acting on any volunteer |
| Core Crew | 13184 | e.g. the Welcome Party "Party Host" position |
| Signed Behavioral Standards | 1000012 | Marker that the agreement is signed |
| TrainingWelcomeComplete | 174766 | Welcome/Hive course checklist item |
| Staff | 2000006 | SAP bypass |
| OtherSAP | 2000007 | SAP bypass (has a pass from another source) |
| CensusLabCamp | 2000009 | Census-Lab-camper-only shifts (e.g. Lab Stewardship) |
| BurnerProfileUpdated | 2000010 | Checklist item |
| EmailUnsubscribed | 2000020 | Email opt-out |

A volunteer gets a role three ways: **manual** grant by an admin; **training
completion** (visiting a Hive training link hits `/training/confirmation/[code]`,
which adds the training's `role_id`); or **signing** the Behavioral Standards
agreement (adds 1000012).

**Positions gate on `role_id`** (the real eligibility check) and separately on
`prerequisite_id` (a signup-time training *prompt*, not a hard gate).

## 3. On-playa vs off-playa

One build-time flag, `NEXT_PUBLIC_PIN_ENABLED`, drives every difference (it
inlines at build, so it's a per-deployment decision — the on-playa and web
deployments are separate builds).

| | On-playa (`!= "false"`) | Off-playa / web (`"false"`) |
|---|---|---|
| Sign-in | Passcode + name dropdown | Okta SSO |
| Session / idle | 1h session, 5-min idle logout (shared tablets) | 24h session + 24h idle (personal devices) |
| `/shifts` access | Open to walk-ups (kiosk) | Requires auth |
| Behavioral Standards | **Force-redirect** after login until signed | Plain checklist item, no forced redirect |
| Kiosk | 24/7 unauthenticated browse | n/a |

The web-vs-on-playa help-text split is deferred and tracked in **#328**.

## 4. The checklist

The checklist on a volunteer's Account page is **derived from roles**, not a
stored list. Items:

- **Trainings** — trainings linked to the volunteer's shift positions
  (`op_position_trainings` → `op_trainings`); each shows complete if the
  volunteer holds that training's role. This is how "link a training to a
  position → it appears on the checklist" works.
- **Behavioral Standards** — complete if they hold role 1000012.
- **Welcome / Hive course** — role 174766; leads the checklist (#511).
- **Burner Profile Updated** — role 2000010.

## 5. Shift signup eligibility & CSP/SAP

- **Signup gates:** position `role_id` (hard eligibility) → time conflict
  (double-booking flagged — an edge over Shiftboard) → full. The agenda renders
  each as a gray-out reason.
- **Check-in window:** 1h before start → 2h after end (UI-gated, not enforced
  server-side).
- **CSP (Census Shift Points):** summed from a volunteer's active shift
  positions; required total hardcoded at 12; also broken out per day.
- **SAP:** a volunteer bypasses the CSP requirement if they have a SAP on
  record, hold Staff or OtherSAP, or arrive post-opening. Pre-opening arrivals
  owe ≥1 CSP on specific days keyed to their arrival date.

---

## 6. Gap analysis

**Current app Help** (`src/app/help/Help.tsx`, 3 sections, all tablet-operator
oriented) has **nothing** on: signing up for shifts, the checklist, trainings,
CSP/SAP, account management, or web/kiosk access. It also still contains stale
copy (walk-in account procedure, "Unanswered Questions book," a "tablet guide in
the file folder" that doesn't exist, no "how to remove a shift"). See #328, #440,
#486, #516.

**The 2025 tablet manual** is missing: the agenda / My-Shifts view, the welcome
course, the training→checklist mechanism, CSP/SAP, and all of the role / dates /
positions / SAP admin — and is written only from the tablet/lab-host viewpoint.

## 7. Doc split (which process goes where)

- **🌐 Web Help (volunteers):** before-login + all self-service rows — sign in,
  create account, contact, reports; profile, checklist, **sign up / remove /
  view shifts**, CSP/SAP, trainings. Accordion structure; "still need help?" →
  Contact ("App feedback") + Discord.
- **🏕️ On-playa Help / tablet manual (lab hosts & shift leads):** the tablet
  rows — open a roster, check in/out, add/remove, review, kiosk walk-up,
  create walk-in accounts, plus the admin roster/roles depth.
- **📘 Full manual (all tiers/contexts):** everything above, step-by-step per
  tier × access, with a returning-volunteer "What's changed since Sept 2025"
  section.

---

*Generated from the CensusScheduler codebase (routes/nav, ~80 API endpoints,
auth/access model). Update this file when app functionality changes — it is the
source blueprint for both help docs.*
