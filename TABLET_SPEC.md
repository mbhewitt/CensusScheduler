# PEERS Tablet Responsibility — Spec (design, iterating)

**Status:** design agreed with papabear 2026-07-25. On-playa workflow, NOT urgent —
build on census-ops-test and iterate; nothing near prod until signed off. The
one **related piece already shipped**: Behavioral Standards is now a hard
requirement to take shifts (see bottom).

## Goal
Consolidate tablet check-out/return tracking into the scheduler (replacing the
separate Google Sheet). A Squaddie agrees to the tablet responsibility form
before taking Squaddie shifts, and Shift Leads/Coords/Admins record the tablet #
at check-in and mark it returned — so "is this Squaddie in the field / has the
tablet come back?" lives in one place.

## The agreement (from papabear's PDF, PEERS_Tablet_Responsibility_Agreement)
> In signing this document, I agree to return the PEERS recording tablet to my
> PEERS shift lead at the conclusion of my shift. Normal wear and tear is
> expected, and accidents happen, but I may be held financially responsible if
> the tablet is not returned at all.

Form fields on the agreement: **Camp Name**, **Camp Address**, **Phone Number**,
+ a "check the box to agree" checkbox.

## 1. Tablet Agreement = pre-playa checklist item, gates SQUADDIE shifts
- New read-&-agree checklist item in VolunteerInfo `/info` (like Behavioral
  Standards / Burner Profile). Presents the agreement text + the 3 text fields
  (Camp Name, Camp Address, Phone Number) + an agree checkbox. Signing records
  it (grant a new self-sign role, e.g. `ROLE_TABLET_AGREEMENT`, + persist the
  camp/address/phone).
- **Required for Squaddies to take Squaddie shifts** — hard server gate, same
  pattern as the BS gate. **Shift Leads, Coordinators, Admins do NOT see it and
  are NOT locked out** (papabear). (Open Q to confirm when building: does a Lead
  who takes a *Squaddie* shift need it? papabear said Leads aren't locked out —
  lean: gate applies to Squaddie-role holders / exempt Lead+Coord+Admin.)
- **Camp name / address / phone (decision b):** captured on THIS form (there is
  no leftover Census camp/address field — it was removed; verified 2026-07-25).
  Store on op_volunteers (add columns camp_name, camp_address; phone already
  exists) or a dedicated table.

## 1a. Retro-notify existing signups (decision c)
- Export everyone who already has a shift (name + email) — reuse the CSV pattern.
  papabear emails them to go sign. **Lock FUTURE shifts until signed; existing
  claimed shifts are kept** (gate the claim, don't remove). Same shape as the BS
  gate.

## 2. Walk-ins
- On-playa, signing the tablet agreement (and Behavioral Standards) becomes part
  of the walk-in flow before they can claim. Same gate.

## 3. "Tablet #" column on Shift Volunteers page
- New editable column, **2-digit number**, entered by Shift Lead/Coord/Admin at
  check-in (per assignment). **Sortable** (to make step 4 easy). Leadership-only
  (like Check In / World name). New per-assignment field
  (op_volunteer_shifts.tablet_number) + a save endpoint + editable cell UI.

## Shift Volunteers column order (papabear 2026-07-25)
Full desired left-to-right order (some are leadership-only, listed for
reference): **Playa Name, World Name, Position, Tablet #, Check-in, Returned,
Walk-In, Admin, Admin actions.** So Tablet # slots between Position and Check-in;
Returned slots between Check-in and Walk-In. The existing relative order already
matches — just insert the two new columns in these spots when building #3/#4.

## 4. "Returned Tablet" toggle on Shift Volunteers page
- New leadership-only per-assignment toggle; Lead/Coord/Admin flips it when the
  Squaddie returns the tablet — tells us the Squaddie + tablet are back. New
  field (op_volunteer_shifts.tablet_returned) + endpoint + toggle UI.

## 5. Tablet report export (papabear 2026-07-25)
- New CSV export on the Reports page, for **Shift Leads AND higher** (Shift
  Lead + Coordinator + Admin/SuperAdmin — broader than the other reports which
  are admin+coord). Columns: **Which shift** (name + date/time), **Name** (world
  name), **Playa name**, **email**, **camp name**, **camp address**, **phone
  number**, **tablet number**.
- One row per active shift assignment. Depends on the Tablet # field (#3) +
  camp/address/phone (from the agreement). So build this WITH the Tablet #
  column. Reuse the CSV pattern from the New Volunteers report.
- Note: Shift Leads don't currently get a Reports nav entry (only coords/admins
  via pageListCoordinator) — extend nav to Shift Leads for this, or give them a
  direct link.

## Build pieces (all on test first)
- [ ] Migration: op_volunteers.camp_name, camp_address (phone exists); a
      tablet-agreement signed marker (role or column); op_volunteer_shifts
      .tablet_number + .tablet_returned.
- [ ] Tablet Agreement checklist item + sign page (agreement text + fields).
- [ ] Server gate: Squaddie shift claim requires tablet agreement signed
      (exempt Lead/Coord/Admin) + client grey-out to match. Future-only lock.
- [ ] Tablet # editable + sortable column (leadership) + save endpoint.
- [ ] Returned Tablet toggle (leadership) + endpoint.
- [ ] Walk-in flow: fold the agreement (+ BS) sign step in.
- [ ] Export "already signed up" list for papabear's nudge email.

## Related — DONE (live on prod 2026-07-25, `8cdfb81`)
**Behavioral Standards is now a HARD requirement to take shifts** for Squaddies +
Shift Leads (Coordinators/Admins exempt — signed elsewhere). Server-gated in the
shift-claim POST + client grey-out (Shifts.tsx, add dialog). Gates the claim
only; existing shifts kept. The tablet gate follows this exact pattern.

## Decisions & progress — 2026-07-26 (papabear)

**SHIPPED TO TEST (`c62e00a`), required fields + Open Camping:**
- Camp Name + Phone are **always required** to Sign; Camp Address **required too**,
  EXCEPT an "I'm in Open Camping" volunteer **before Gate open**.
- **Gate open = Sun 2026-08-30, 12:01am PDT = 07:01 UTC** → `GATE_OPEN_ISO` in
  constants.ts (shared client+server).
- **"I'm in Open Camping" checkbox** sits under Camp Name, before Camp Address.
  Pre-Gate, checking it **hides + waives** Camp Address (sign with Name+Phone).
  At/after Gate the checkbox no longer hides it; address shown + required for all.
- No new DB column — "address pending" is **inferred** = holds TabletAgreement role
  AND `camp_address` empty (only an open camper pre-Gate can reach that state).
- `/info` now returns `tabletAgreementSigned` + `tabletAddressPending`. Checklist:
  pre-Gate pending = **"Signed (camp address pending)"** and counts as **done**;
  post-Gate pending = **outstanding** "Add your camp address" item (not done).
- Server mirrors the required-field validation (400 if missing). Files: constants.ts,
  roles/tablet-agreement/[shiftboardId]/TabletAgreement.tsx, api/roles/tablet-agreement,
  api/volunteers/[id]/info, types/volunteer-info.ts, info/VolunteerInfo.tsx.

**2.a — how open campers get their address in later (NEXT to build):**
- Shift Leads **CANNOT** edit a volunteer's account (verified: account write =
  `isOwnerOrAdmin`; leadership is read-only — "leadership read access must NOT grant
  edit rights"). So NOT via the account page.
- Build: on the Shift Volunteers page, an open-camper still missing an address shows
  an **"address needed" indicator** on their row → lead **clicks the volunteer → small
  popup** with just a **Camp Address** field + **Confirm/Cancel** (no navigation).
  Saves via a **new narrow endpoint** that lets Shift Lead+coord+admin write ONLY
  `camp_address` for that assignment's volunteer. Self-serve re-flag stays as a light
  nudge but is NOT the primary path (papabear: unlikely to happen).
- Known follow-up: the self-serve reopen-form path starts blank (post-Gate requires
  re-entering name/phone too). Fine for now since the lead popup is primary; pre-fill later.

**Loose ends resolved:** NO shift-capacity bumps (papabear makes that call manually);
NO new shifts-by-day/type report (he'll use the Shifts table view). Lead-capacity note
retained: Lead shifts are 2 slots each, several already full (Sun, Mon×2, Thu).
