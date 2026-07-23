# Walk-in Squaddie Shift Signup — Spec

**Status:** design agreed (papabear + Mew, 2026-07-23). Parked for August/playa build; does **not** block the week-of-2026-07-22 Okta launch (off-playa).

## Plain-English summary (for the team)

**The idea:** once volunteers are physically on-playa, they can sign up for Squaddie shifts even if they never did the online (Hive) training. Off-playa, training is still required — being on-site is the "pass."

**A trained Squaddie (did Hive):** signs up for and changes shifts from home or on playa, exactly like today. Nothing changes for them.

**A walk-in at HQ (no training):**
1. A lead hands them a tablet open to the "Create Account" page.
2. They enter their name + email and pick a 4-digit passcode.
3. They're signed in automatically and pick from the available Squaddie shifts.
4. They can come back later, sign in with their name + passcode, and add/drop shifts.

**Last-minute trainee (still at home):** finishes Hive → gets the Squaddie role → can sign up before they even leave for playa.

**The passcode (so no Burner Profile login is needed on playa):** everyone automatically gets a unique 4-digit code. It prints on their "Print my Schedule" and they can view/change it in their account. On playa they sign in with their name + that code.

**Guardrails:** a shift can't be overbooked past its real headcount no matter who signs up; only Squaddie shifts open to walk-ins — Lead and other shifts still require their role; and the roster name-list is only reachable on-playa or by an admin.

## Goal

Let a volunteer who is **physically on-playa** claim a Squaddie shift **without** having done Hive training, while volunteers **off-playa** must still hold the trained **Squaddie** role (earned via Hive) to claim. No new roles, no new pages, no date logic — just make one eligibility check IP-aware.

Rule, in one line:

> A **Squaddie** shift may be claimed when **(volunteer has the Squaddie role) OR (request is on-playa by IP)**. Admins remain exempt (overbook flow unchanged).

**Scope (important):** the on-playa bypass applies **only to positions whose required role is the Squaddie role**. Every other role-gated position (Lead, etc.) stays strictly role-gated **regardless of IP** and visible only to its assigned roles — unchanged. Walk-ins are a Squaddie-only concept. So the eligibility branch keys on "`roleRequiredId === SQUADDIE_ROLE_ID`", not "any non-zero `roleRequiredId`."

### How it serves the cases
- **Walk-in on-playa, untrained** → self-registers (no role), on-playa IP lets them claim. ✅
- **Last-minute trainee off-playa** → does Hive → gets Squaddie role → already qualifies off-playa, can sign up before leaving home. ✅
- **Untrained off-playa** → blocked; must train. ✅
- **Trained anywhere** → unchanged. ✅

### Explicitly dropped from earlier drafts
- ❌ `new_squaddie` role + auto-grant + position tagging — **not built.** Trained-vs-walk-in is reconciled offline by comparing the **Hive completion export** against a **PEERS shift export**. IP is the walk-in pass, not a role.
- ❌ Date gate — **not built.** The on-playa IP range only carries traffic once people are physically out there, so it's self-limiting in time. Build-week discovery isn't a concern: the Create Account link is handed out in person + there's an in-person training protocol.

## The one real change (server-side)

**File:** `client/src/pages/api/shifts/[timeId]/volunteers/index.ts` — the POST claim handler (`shiftVolunteers`, capacity guard at ~L436–498, added in c9c677b).

Today the position's required role (`op_position_type.role_id`, surfaced as `roleRequiredId`, `0` = no role required) is enforced **UI-side only** in `client/src/app/shifts/[timeId]/volunteers/ShiftVolunteersDialogAdd.tsx` (~L341–347). The server does **not** check it (see PEERS_TODO.md). So this feature must **add the server-side role check** and the on-playa bypass together — otherwise off-playa untrained users can already claim via direct API.

In the same transaction as the capacity guard, before inserting the assignment:

1. Read the position's required role:
   `SELECT role_id FROM op_position_type WHERE ... ` (join via the `time_position_id` → `op_shift_time_position` → `op_position_type`), value `null`/`0` ⇒ open.
2. Compute eligibility (non-admins):
   - `roleRequiredId === 0` → allowed (unchanged, open position).
   - `roleRequiredId === SQUADDIE_ROLE_ID` → allowed iff **volunteer holds the Squaddie role** (`op_volunteer_roles`) **OR** `isOnPlaya(headers)` is true. ← the walk-in bypass, Squaddie-only.
   - any **other** `roleRequiredId` (Lead, etc.) → allowed iff volunteer holds that role. **No IP bypass** — role-gated stays role-gated everywhere. (This also closes the current server-side gap for those positions.)
   - not allowed → `403 { message: "This shift requires Hive training, or sign up on-playa." }`.
3. Admins (`ROLE_ADMIN_ID` / `ROLE_SUPER_ADMIN_ID`) stay exempt, as with capacity.

Use the existing helper — no new IP machinery:

```ts
import { isOnPlaya } from "@/lib/onPlaya";
const onPlaya = isOnPlaya((name) => {
  const v = req.headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v ?? null;
});
```

`isOnPlaya` reads the unspoofable nginx `X-Real-IP` against `PEERS_ONPLAYA_CIDR` (default `162.212.150.0/23`) — the same gate that guards passcode sign-in (`client/src/pages/api/sign-in/index.ts`).

## Passcode on the printable schedule (papabear, 2026-07-23)
Instead of printing individual passcodes for off-playa signups, put the passcode on the volunteer's **Print my Schedule** output so they can bring it to playa and manage their account without a Burner Profile.
- **Already randomized per user** — no change needed to get uniqueness. `generatePasscode()` (`client/src/utils/generatePasscode.ts`) uses `crypto.randomInt` → unique 4-digit code at account creation, on both the Okta-seeding paths (`api/auth/okta/callback.ts`) and self-register; existing rows were random-backfilled (`migrations/005_backfill_okta_passcode.sql`). Only the seeded admin is hardcoded (`123456`, `scheduler_schema.sql:361`) — not a real volunteer.
- **Change:** `buildSchedulePrintHtml()` (`client/src/utils/buildSchedulePrintHtml.ts`, insert after the subtitle ~L228) gains a `passcode` param; the print handler in `VolunteerShifts.tsx` (~L525) fetches the current passcode (self-view, via the existing reveal/passcode API) and passes it in. Prints the **most current** passcode at print time.
- **Conscious tradeoff:** the passcode is a sign-in credential, so it's readable by anyone who sees the printout, and a printout goes stale if they later change it. Low-stakes on-playa (IP-gated + only touches one's own schedule) — accepted for convenience.

## Passcode reset by Shift Leads + Coordinators (papabear, 2026-07-23 — OPEN decision)
**Admins can already reset any volunteer's passcode today** — no build needed: `VolunteerInfo.tsx` Security section (~L596, `isAdmin || isSuperAdmin`) has an "Update passcode" button → PATCH `api/volunteers/[shiftboardId]/account/passcode` (gated `isOwnerOrAdmin` in `lib/authz.ts`). papabear wants to also let **Shift Leads** (`ROLE_PEERS_SHIFT_LEAD_ID = 2000101`) and **Coordinators** (`ROLE_PEERS_COORDINATOR_ID = 95209`) reset passcodes (both are real roles with `checkIsPeersShiftLead`/`checkIsPeersCoordinator` helpers ready).

Two spots to change (**both**, or it's UI-only and unenforced):
1. UI gate `VolunteerInfo.tsx:~596` — add Lead/Coordinator to the Security-section conditional.
2. Server gate — extend `isOwnerOrAdmin` (or add a helper) in `lib/authz.ts` used at the passcode PATCH route (~L55) to include role IDs 2000101 + 95209.

Design (CONFIRMED papabear 2026-07-23):
- **Reset flow = the target types their own new code.** Lead/Coordinator opens the target's account → "Update passcode" → hands over the tablet → the **target types a fresh code**. Inherently reset-only: the Update dialog only *sets* a new passcode (never shows the old), and the reveal control is already **self-only** (`PasscodeReveal` shown under `isSelfView`), so Leads/Coordinators never see anyone's code. → No need to split reveal/change; just widen who sees the "Update passcode" button + the server gate.
- **Rank hierarchy: admin > coordinator > shift lead > squaddie. You may reset anyone STRICTLY below you.**
  - Shift Lead (2000101) → Squaddies only.
  - Coordinator (95209) → Shift Leads + Squaddies (NOT admins, NOT other coordinators).
  - Admin/SuperAdmin (2/1) → anyone, incl. other admins (unchanged from today; the one edge, treat admin-on-admin as allowed).
  - A target's rank = their **highest**-held role, so a Lead who is also an admin is protected at admin level.
- Implementation note: the server gate must compute BOTH the requester's rank and the *target's* highest rank and enforce requester_rank > target_rank (admins bypass to reset-anyone). Rank map from role IDs above.

## Re-enable passcode view/change for volunteers (self-view)
Today the passcode reveal/change UI is **admin/superadmin-only** — `VolunteerInfo.tsx` Security section gated `(isAdmin || isSuperAdmin)` (~L596). Re-expose it to regular volunteers on their own record (self-view) so returning walk-ins can manage their own passcode. Keep the existing view/hide + change mechanics as-is. The passcode-change API (`api/volunteers/[shiftboardId]/account/passcode`) already gates owner-or-admin; client form validates 4-digit numeric.

## Sign-in name-picker roster privacy (papabear, 2026-07-23 — RESOLVED)
On-playa passcode sign-in (`SignIn.tsx`) uses a name typeahead fed by `/api/volunteers/dropdown`, which returns `PlayaName "WorldName"` (legal name) for the whole roster and is currently **PUBLIC** (in `middleware.ts` allowlist, no auth, not IP-gated). papabear's only concern is off-playa exposure; on-playa kiosk use is fine. **Decision: keep the typeahead as-is; gate the endpoint** — allow `/api/volunteers/dropdown` only when **`isOnPlaya(headers)` OR requester is admin/superadmin**. This blocks a regular off-playa Squaddie from enumerating names, keeps the on-playa kiosk picker working (walk-in not yet signed in), and keeps the two authed admin dialogs working off-playa (role add `RoleVolunteersDialogAdd.tsx:70`, shift add `ShiftVolunteersDialogAdd.tsx:143`). Rejected: switching sign-in to email+passcode (papabear: too much friction). No UX change.

## Hamburger nav links for admins (papabear, 2026-07-23 — DONE in working tree, not committed)
Added two drawer links, **admin/superadmin-only** (hidden for everyone else), so a lead can pull up the kiosk pages: **Passcode sign-in** (→ `/sign-in`) under **Home**, and **Create Account** (→ `/volunteers/account/create`) under **Contact**. File: `client/src/components/layout/Header.tsx` (inline in the general-nav map, mirroring the existing "My Account and Shifts"-after-Home injection; new icons `PasswordIcon`/`PersonAddIcon`). Typecheck + prettier clean. NOTE: off-playa `/sign-in` still hides the passcode form (IP-gated) — the link is mainly useful on the kiosk/playa network.

## "Walk-In" column on the Shift Volunteers page (papabear, 2026-07-23 — OPEN nuance)
Add a new column to the **right of "Check In"** on the Shift Volunteers page, titled **"Walk-In"**, a checkbox that indicates the assigned volunteer signed up for a Squaddie shift **without holding the Squaddie role** (`ROLE_PEERS_SQUADDIE_ID = 2000102`) — i.e. no Hive training. Lets Shift Leads tell walk-ins from Hive-trained at a glance.
- **Recommended: auto-computed & read-only** — box checked automatically when the row's volunteer lacks the Squaddie role. No manual ticking (can't be forgotten, always accurate), no new DB column.
- **Visibility:** leadership-gated (Leads/Coordinators/admins), same as the existing Check In + World Name columns (`canSeeVolunteerDetails`). Regular Squaddies don't see it.
- **Build (contained):** the shift volunteer-list GET currently does NOT carry roles — `api/shifts/[timeId]/volunteers/index.ts` SELECT (~L116) joins position+volunteer but NOT `op_volunteer_roles`, and `IResShiftVolunteerRowItem` (`components/types/shifts/index.ts` ~L46) has no roleList. So: (1) join `op_volunteer_roles` (or a LEFT JOIN keyed on role_id=2000102) and add `isWalkIn`/`isSquaddie` boolean per row; (2) add the column in `ShiftVolunteers.tsx` columns array right after "Check in" (~L481), leadership-gated, rendering a read-only checkbox from that flag.
- **CONFIRMED (papabear 2026-07-23):** read-only ✓, leadership-gated ✓, **auto-computed reflecting current role** ✓ — a walk-in who later completes Hive flips to **unchecked** (reflects real training status). No permanent-stamp variant. Fully specced.

## Optional UI polish (not required for correctness)
- `ShiftVolunteersDialogAdd.tsx` availability check (~L344) currently greys out **Squaddie** positions when the viewer lacks the role. On-playa it should treat **Squaddie** positions as claimable (leave Lead/other role-gated positions greyed as today). Cosmetic — server is the real gate — but avoids a confusing greyed-out button at HQ. Pass on-playa state (already available via the `ON_PLAYA_COOKIE` set in `middleware.ts`) into the check.

## Build checklist
- [x] Server: add role+on-playa eligibility check to the shift-claim POST handler — on-playa bypass **Squaddie-only** (`roleRequiredId === SQUADDIE_ROLE_ID`); other role-gated positions enforced role-only. Closes the current UI-only gap **and** adds the walk-in bypass. DONE (`api/shifts/[timeId]/volunteers/index.ts` POST, target-volunteer role check via `op_volunteer_roles` + `isOnPlaya`).
- [x] Return a clear 403 message distinguishing "needs training / sign up on-playa" from the 409 "full". DONE (403 "This shift requires Hive training, or sign up on-playa." for Squaddie; generic role message otherwise).
- [x] (UI) On-playa: don't grey out **Squaddie** positions in the add dialog (Lead/others unchanged). DONE (`ShiftVolunteersDialogAdd.tsx`, `useIsOnPlaya()` branch).
- [x] Passcode → **Print my Schedule**: add `passcode` param to `buildSchedulePrintHtml`, fetch + pass current passcode from the print handler. DONE (`buildSchedulePrintHtml.ts` + `VolunteerShifts.tsx` handlePrint fetches self passcode).
- [x] Re-enable passcode view/change UI for self-view volunteers (`VolunteerInfo.tsx` Security section). DONE (Security section now `canManagePasscode` — self/admin/rank-superior).
- [x] Gate `/api/volunteers/dropdown` to **on-playa OR admin/superadmin** — roster privacy. DONE (in-handler `isOnPlaya` OR `isAdmin(session)` check; stays reachable for the no-session on-playa kiosk).
- [x] **"Walk-In" column** on Shift Volunteers page (right of Check In, leadership-gated, auto-checked when volunteer lacks Squaddie role): API — `isWalkIn` derived from `op_volunteer_roles` in the GET (+ socket push); UI — new read-only column in `ShiftVolunteers.tsx`.
- [x] Passcode reset for **Shift Leads (2000101) + Coordinators (95209)** with **rank hierarchy** (reset anyone strictly below): server gate `lib/authz.ts` `canManageVolunteer` (requester_rank > target_rank; admins bypass) wired into the passcode PATCH; UI gate `VolunteerInfo.tsx`. Info/account **read** widened to rank-superior leadership so a lead can open a subordinate's page (mutations stay owner/admin — privacy expansion OK'd by papabear 2026-07-23, conditioned on keeping the hierarchy).
- [x] Hamburger: Create Account (under Contact), admin OR on-playa — DONE + shipped to prod (`c67b32e`). (Passcode sign-in link was dropped per papabear.)
- [ ] Verify on the test site with an IP temporarily added to `PEERS_ONPLAYA_CIDR` to simulate on-playa.

## Testing the walk-in experience (papabear, 2026-07-23 — OPEN)
The **Mock account type** (Settings → Developer Mode: Admin / Authenticated / Unauthenticated) is **client-side only** — stored in sessionStorage, never sent to the server (`fetcher.ts` sends no dev payload; zero `accountType` refs in `pages/api/`). It only flips client-side UI gates; the server always checks the real session cookie + real roles + real on-playa IP. And `useIsOnPlaya()` reads the `peers-on-playa` cookie set from nginx `X-Real-IP` with **no dev override**. So:
- "Unauthenticated" mock does NOT reproduce walk-in (a walk-in is *authenticated, no role*, not logged-out; and the mock can't fake on-playa → server rejects the claim).
- A new "Walk-in" mock type wouldn't help either — a client mock can't fake on-playa or make the server grant a walk-in claim; it'd show non-functional UI.
- **Recommended real test:** on census-ops-test, temporarily add the tester's IP to `PEERS_ONPLAYA_CIDR` (the reversible env trick used for the passcode preview) + self-register a fresh no-role account → walk the full flow (signup, passcode, claim Squaddie shift, Walk-In column). Exercises real client + server.
- **Optional (papabear to decide):** build a **test-site-only "on-playa" dev toggle** for repeatable self-serve testing — MUST stay off prod (on-playa is a real access-control gate; a prod bypass would let anyone skip training). Would need a guarded server-side honor (e.g. only when a test-only env flag is set) since the gate is server-enforced.

## Reconciliation (ops, no build)
Trained vs walk-in = compare **Hive completion export** ⟷ **PEERS shift/assignment export** by email. No in-app tracking needed.
