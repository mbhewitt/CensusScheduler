# Design: Multi-Tenant CensusScheduler

**Status:** Draft for review — no implementation in this doc's scope.
**Resolves:** the design deliverable for the tenant-config architecture issue; feeds #218 (multi-tenant umbrella) and #237 (roles/permissions config).
**Date:** 2026-07-23

---

## 1. Problem

The scheduler runs today as two divergent copies of one repo:

| | Census | Peers |
|---|---|---|
| Branch | `main` | `peers-main` |
| Host | volunteers.census.burningman.org | volunteers.peers.burningman.org |
| Infra | EC2 + RDS db `census` | EC2 + RDS db `peers` |

`peers-main` has diverged by **174 files (+4,680 / −7,659)**: full rebrand, rewritten copy (Home, Behavioral Standards, Help), removed subsystems (SAP, labels, shift-eligibility API), new features (walk-in signup with IP-gated passcodes, participation report, schedule print, shift badges), and new business rules (scheduling guards, training-first gating). `PEERS_TODO.md` on that branch is a hand-maintained ledger of every Census-specific hardcoding Peers had to hunt down — it is, in effect, the requirements spec for this design.

Every future department (Placement was already named in #218) repeats this fork unless the platform absorbs the differences. Long-lived branches also block **cross-pollination**: Peers built scheduling guards and self-service Drop Shift that Census might want, but there's no way to opt in short of cherry-picking across diverging trees.

### Goals

1. **One codebase, N tenants.** Census, Peers, and future groups run from `main` at their own subdomains.
2. **Not one deployment per site.** Each site sees at most tens of interactions/day; a container per tenant×env is unsustainable. One running app serves all tenant hostnames (Discourse-multisite style), resolving the tenant per request from the `Host` header.
3. **Hard isolation.** Each tenant keeps its **own database** with its own scoped DB credentials, own session secret, own mail queue, own file dirs. No tenant can clobber another — by data, config, or deploy.
4. **Three customization tiers.** (T1) settings/options; (T2) wholesale replacement of a UI page or business-logic component; (T3) net-new features that other tenants may later enable.
5. **Cross-pollination.** A feature built for one tenant becomes an opt-in flag for all. This kills per-tenant branches by design.
6. **test / staging / prod per tenant**, each on its own hostname.
7. **Meta dashboard** per tenant: see/choose which version each environment presents, edit settings, promote test→staging→prod.
8. **Onboarding wizard** for a new group.
9. **Agent-friendly governance.** Changes are largely made by Claude agents in per-team channels; "which files may a tenant-scoped change touch" must be mechanically checkable, with human approval gates.

### Non-goals / YAGNI

No Kubernetes/Nomad/Swarm, no Terraform, no secrets manager (600-mode files on two boxes), no `tenant_id` row-level multi-tenancy (per-tenant DBs *are* the isolation), no runtime config store or CMS (config is git), no MDX/i18n pipeline (copy is TSX), no zod/ajv (tsc is the validator), no AsyncLocalStorage (explicit params), no per-tenant build variants or webpack aliases, no autoscaling/load balancers/multi-region, no per-tenant branches. The on-playa offline deployment (`docker-compose-playa.yaml`) stays single-tenant and is out of scope.

### Prior art (what transfers)

- **Discourse multisite** — the closest analog: one Rails app, DB-per-site, hostname routing, per-site settings, per-site theme/plugin enablement. We copy the shape wholesale.
- **Odoo.sh** — DB-per-tenant + module toggles + branch-per-environment promotion; our features/flags and test→staging→prod flow mirror it.
- **WordPress multisite** — shared code + per-site config works at huge scale; its cautionary tale (unreviewed plugin sprawl) is why T3 features live in the shared tree behind flags, not in per-tenant code.
- **Shopify** — the settings-vs-theme split maps to our T1 config vs T2 overrides.
- **GitOps image pinning** — desired state in a small git registry, a dumb reconciler makes reality match; promotion = moving a tag reference, rollback = revert.

---

## 2. Runtime multi-tenancy (codebase)

### 2.1 Tenant packages: config-as-code

One directory per tenant, in the repo:

```
client/src/tenants/
  types.ts                    # TenantConfig + TenantOverrides types (the schema)
  registry.ts                 # EDGE-SAFE: imports each tenant's config.json;
                              #   hostname → tenant lookup. No React, no Node APIs.
  overrides.ts                # tenantId → component-override map (never imported by middleware)
  census/
    config.json               # all T1 data (shape in §2.2)
    index.ts                  # import cfg from "./config.json"; export default cfg satisfies TenantConfig;
    overrides.ts              # { Home, BehavioralStandards, GetInvolved, Help }
    Home.tsx                  # moved from client/src/app/Home.tsx
    BehavioralStandards.tsx   # moved from the app tree
    ...
  peers/                      # same shape, content ported from peers-main
client/public/tenants/census/ # logo, banners, help screenshots
client/public/tenants/peers/
```

**Why repo files, not an `op_tenant_config` table:** git gives versioning, review, diff, and rollback for free; the meta dashboard already needs git to control "which version is live," so config rides the same rails; changes are made by agents that edit files anyway; and there is exactly one source of truth. The `resolveTenant()` seam hides storage — if dashboard-driven live edits ever become frequent enough that commit+deploy hurts, the data slice can move behind the same `TenantConfig` shape with zero callsite changes. Not built now.

**Validation = the compiler.** Each tenant's `index.ts` ends in `satisfies TenantConfig`, so a malformed `config.json` is a compile error; the existing `tsc`/`next build` CI step *is* the schema check. Machine-editable (plain JSON), validatable (tsc), versioned (git) — which is what the dashboard needs.

**Secrets never enter config.json.** Env convention: uppercased tenant id prefix — `CENSUS_MYSQL_HOST`, `CENSUS_MYSQL_PASSWORD`, `CENSUS_SESSION_SECRET`, `PEERS_SMTP_PASS`, … One helper `readTenantEnv(tenant, "SESSION_SECRET")`. A boot check in `client/instrumentation.ts` fails fast if any registered tenant is missing a required secret. Because config.json holds no secrets, the whole object is safe to hand to the client.

### 2.2 `TenantConfig` shape (T1 — settings)

Every key below is something Census or Peers has *already* diverged on (source: `PEERS_TODO.md`, `constants.ts`, `lib/mail`, `lib/sapStatus.ts`):

```ts
interface TenantConfig {
  id: string;                       // "census" — also the env-var prefix
  name: string;                     // "Census"
  hostnames: string[];              // prod + staging + test + localhost aliases
  urls: { base: string; calendarUidDomain: string };
  branding: {
    colorPrimary: string;           // replaces COLOR_CENSUS_PINK
    colorSecondary: string;         // replaces COLOR_BURNING_MAN_BROWN
    logoHeader: string; favicon: string;
    banners: Record<string, string>;      // pageKey → /tenants/<id>/… asset path
  };
  emails: {
    contactRecipients: Record<string, string>;  // replaces CONTACT_RECIPIENTS (single-entry = Peers's model)
    contactCc: string | null;
    mailFrom: string;                           // replaces MAIL_FROM default
    mailDefaultReplyTo: string;
    criticalDropRecipients: string[];           // replaces VC_LIST_EMAIL(S)
  };
  roles: {                          // replaces hardcoded ids in constants.ts (+ the duplicate in info/index.ts)
    adminId: number; superAdminId: number; behavioralStandardsId: number;
    coreCrewId: number | null; emailUnsubscribedId: number;
    displayNames: Record<string, string>;       // ROLE_DISPLAY_NAMES
  };
  location: { icsLocation: string; emailAddressLine: string };  // assignmentNotify.ts:152/:225
  copy: {                           // SHORT strings only — helper texts, legendList, MEAL_LIST, page-title prefix
    titlePrefix: string;
    helperTexts: Record<string, string>;
    reviewLegend: string[]; mealList: string[];
  };
  auth: {
    okta: { enabled: boolean } | null;          // replaces NEXT_PUBLIC_OKTA_ENABLED (creds stay in env)
    pin: { enabled: boolean; onPlayaCidr: string | null };  // replaces NEXT_PUBLIC_PIN_ENABLED;
                                                //   per-request CIDR model ported from peers-main af05388
    sessionMsOnPlaya: number; sessionMsOffPlaya: number;
  };
  features: {                       // §2.5 — module toggles
    sap: boolean; labels: boolean; shiftEligibilityApi: boolean; doodle: boolean;
    walkIn: boolean; participationReport: boolean; schedulePrint: boolean; shiftBadges: boolean;
    reports: "census-population" | "admin-csv" | "off";
  };
  rules: {
    scheduling: null | {            // Peers guards (b1b65eb), parameterized
      crossTypeOverlapMaxMin: number;   // 60
      maxConsecutive: number;           // 2
      consecutiveGapMin: number;        // 60
      dailyCap: number;                 // 3
      exemptRoleIds: number[];          // [95209]
    };
    eligibility: null | {           // SAP params from lib/sapStatus.ts
      preOpenDatenames: string[];
      dayReqs: Record<string, number>;
      cspRoleThresholds: Record<string, number>;
    };
  };
}
```

The **taxonomy** requested by the config issue falls out of this: anything in `TenantConfig` is *tenant-configurable*; anything still hardcoded after the extraction (action types, socket event names, check-in windows) is *structural*. The *checklist-item model* the issue asked about is handled by the tiers rather than a bespoke data model: item wording/links are T1 `copy`/config; item presence follows `features`/`rules` flags; a structurally different checklist is a T2 page override. If a data-driven checklist schema is still wanted later, it becomes one more `rules`-style config block — deferred until a second tenant actually needs it.

### 2.3 Tenant resolution (the load-bearing seam)

- **`resolveTenantByHost(host): TenantConfig | null`** in `tenants/registry.ts`. Pure lookup over the imported configs, matching `x-forwarded-host` (behind nginx) then `host`. Edge-safe so `client/src/middleware.ts` can use it. `DEFAULT_TENANT` env for local dev; unknown host in prod → 404.
- **API routes (all 56 Pages-Router files):** a `withTenant` wrapper —

  ```ts
  withTenant(handler: (req, res, ctx: { tenant: TenantConfig; pool: Pool }) => …)
  ```

  composing with the existing `withAuth` / `withSuperAdmin` (which gain a tenant param for session verification). Mechanical refactor per route: drop `import { pool } from "lib/database"`, wrap the handler, take `pool` from ctx.
- **App Router pages:** the root `client/src/app/layout.tsx` (already a server component) calls `headers()`, resolves the tenant, builds the MUI theme from `branding`, and mounts a `<TenantProvider>` client context. Client components call `useTenant()` — this replaces every `process.env.NEXT_PUBLIC_*` read (11 call sites for PIN, 4 for OKTA).
- **Threading is explicit** (`tenant` as a parameter), not AsyncLocalStorage: boring, greppable, tsc-enforced. The deep server chains are short — `components/api/assignmentNotify.ts` and `shiftVolunteers.ts` gain a leading `tenant` param.

### 2.4 Isolation inside one process

- **DB:** delete the global `export const pool` in `client/lib/database.ts`, replace with `getPool(tenant)` over a lazily-populated `Map<tenantId, Pool>`. Each pool is built from that tenant's `<ID>_MYSQL_*` env with the existing hardening (keepalive, retry-once wrapper, dateStrings) unchanged. **Deleting the export makes tsc emit the exact checklist of every file to migrate** — no route can silently keep a global pool. `drainPool` / `dbHealth` heartbeat iterate the map (per-tenant wedge detection).
- **Sessions (`client/src/lib/session.ts`):** per-tenant HMAC secret + a `tenantId` field inside the signed payload, verified against the resolving tenant. Browsers already scope cookies per host; this is the server-side backstop that makes cross-tenant replay structurally impossible. Session TTL comes from `tenant.auth.sessionMs*` + the runtime on-playa signal instead of the build flag.
- **Mail:** `lib/mail` `readConfig()` → `readConfig(tenant)` (from/replyTo per tenant; SMTP relay + rate limits stay process-global env with optional per-tenant override). Each tenant's `op_email_queue` lives in its own DB; the worker in `instrumentation.ts` loops registered tenants per tick.
- **Files (SAP PDFs, uploads):** per-tenant subdirectory under the mounted data dir, resolved by the same layer.
- **Honest caveat:** with a shared process the *container* is no longer the tenant boundary — the resolution layer plus per-tenant DB users are. A SQL bug in tenant A's request path still physically cannot touch tenant B's schema, because A's pool connects with credentials granted only on A's database. This is the same trade Discourse and WordPress multisite make, and the right one for a two-person ops team at this traffic level.

### 2.5 Feature modules (T3) — runtime checks at three choke points

No build exclusion; disabled code in the bundle is free (the heavy SAP pdf deps are already `serverExternalPackages`). One flag set, `tenant.features`, checked at:

1. **Nav** — `client/src/components/layout/pageList.tsx` entries gain `feature?: keyof Features`; the exported lists become `getPageList*(tenant)` filters. Header/Footer already import from here — the seam exists.
2. **API** — `withFeature("sap", handler)` returns 404 when the flag is off. Wraps the module families: `api/saps/**` (8 routes), `api/labels/*` (3), shift-eligibility, doodle/socket, and the new Peers modules.
3. **Pages** — gated App-Router pages call `notFound()` when the resolved tenant lacks the flag.

Business-rule modules are flags **plus parameters**: the Peers scheduling guards land in `api/shifts/[timeId]/volunteers/index.ts` POST guarded by `tenant.rules.scheduling !== null`, reading thresholds from config (Census: `null` → behavior unchanged). SAP eligibility reads `tenant.rules.eligibility` instead of hardcoded `DAY_REQS` / `PRE_OPEN_DATENAMES`.

### 2.6 Component overrides (T2) — runtime registry

Build-time approaches (per-tenant directories resolved at build, webpack aliases) are out — one build serves all tenants. Instead, the boring version:

```ts
// tenants/types.ts
interface TenantOverrides {
  Home: ComponentType;               // REQUIRED — no default, so tenant #3
  BehavioralStandards: ComponentType; //   can never accidentally ship Census copy
  GetInvolved: ComponentType;
  Help: ComponentType;
  // optional slots added only when a second tenant needs one
}
// tenants/overrides.ts
export const overridesByTenant: Record<string, TenantOverrides> = { census, peers };
```

Page shells select at render: `app/page.tsx` resolves the tenant from `headers()` and renders `overridesByTenant[tenant.id].Home`. Copy-heavy pages are **per-tenant TSX files**, not config strings (325 lines of marketing JSX doesn't serialize), not MDX (a pipeline for zero gain when the editors are agents editing files), not a DB CMS (that's a product, and it breaks "config is git").

All tenants' components compile in every build — a few tens of KB — which means `next build` on every PR type-checks every tenant: cross-tenant breakage is caught in CI, exactly what cross-pollination needs.

### 2.7 Governance ladder (what an agent may touch)

1. **Change a value** → edit your own `tenants/<id>/config.json`.
2. **Replace a page** → add/edit a file in your own `tenants/<id>/` + register it in your `overrides.ts`.
3. **New behavior** → build in the shared tree behind a new `features.*` flag **defaulting off**, enable it in your own config.

A tenant never edits another tenant's directory; shared-tree edits require a flag. Enforced mechanically:

- CI check (~15 lines): PRs labeled `tenant:<id>` must touch only `client/src/tenants/<id>/**` and `client/public/tenants/<id>/**` (`git diff --name-only` against the label).
- `CODEOWNERS` entry per tenant directory → tenant admins auto-requested for review.
- A lint/grep CI line asserting `middleware.ts` imports nothing from `tenants/` except `registry.ts`/`types.ts` (keeps React/Node out of the Edge bundle).

---

## 3. Converging `peers-main` into `main`

Ordered so live Peers prod is untouched until the final cutover; during the transition only bugfixes cherry-pick across.

**Phase 0 — tenantize `main` with Census as the only tenant (zero behavior change).** Reviewable PR series:
1. `tenants/` scaffolding; extract `tenants/census/config.json` from `constants.ts` (colors, CONTACT_RECIPIENTS, role IDs, helper texts, MEAL_LIST, legendList), `assignmentNotify.ts` addresses, `lib/mail` defaults, `lib/sapStatus.ts` params. `constants.ts` keeps only structural constants.
2. `withTenant` + `getPool(tenant)`; delete the global pool export; fix the 56 routes + `components/api/*` + `lib/mail` + `lib/dbHealth` (tsc is the checklist).
3. Sessions/middleware: per-tenant secret, tenantId-bound payload, runtime on-playa CIDR (port peers `af05388`; Census's playa deployment sets `onPlayaCidr` instead of baking `NEXT_PUBLIC_PIN_ENABLED`). **Both `NEXT_PUBLIC_*` flags die here.**
4. `TenantProvider` + `useTenant()`; theme from config; move Home/BehavioralStandards/GetInvolved/Help into `tenants/census/`; feature flags on SAP/labels/doodle/reports (Census: all on → no-op).
5. Deploy Census prod from this. **Gate: e2e suite green + prod soak.**

**Phase 1 — port generic peers-main work into `main`:**
- Server-side signup role enforcement (PEERS_TODO §9A "Harden" — the add-to-shift POST currently trusts the client): a **security fix, ported unconditionally**, not a flag.
- Scheduling guards (`9b58f07`/`04eb7ea`/`d7bf962`/`dab6acb` + unit tests) under `rules.scheduling`.
- Self-service Drop Shift (`30dfe21`) — generic UX, ships as core.
- Walk-in/NewVolunteer auto-grant behind `features.walkIn`; participation report behind `features.participationReport`; schedule print/grid + SQUAD/LEAD badges behind flags.

**Phase 2 — create `tenants/peers/`.** The ledger maps directly:

| PEERS_TODO § | Destination |
|---|---|
| §1 emails, calendar UID | `emails.*`, `urls.calendarUidDomain` |
| §2 reports | `features.reports: "admin-csv"` |
| §3 branding/banners/favicon | `branding.*`, `public/tenants/peers/` |
| §4 Behavioral Standards | `tenants/peers/BehavioralStandards.tsx` |
| §5 SAP/CSP/training-first, ROLE_DISPLAY_NAMES | `features.sap:false`, `rules.eligibility:null`, `roles.displayNames` |
| §6 playa address | `location.*` |
| §7 role names, GetInvolved links | `roles.*`, `tenants/peers/GetInvolved.tsx` |
| §8 ops files | fleet templates (§4), not per-tenant code |
| §9 walk-in + CIDR passcode | `features.walkIn:true`, `auth.pin.onPlayaCidr` |
| scheduling rules | `rules.scheduling: {60, 2, 60, 3, [95209]}` |
| Home copy | `tenants/peers/Home.tsx` |

**Phase 3 — migration-chain reconciliation.** Peers' DB never ran main's 006–008 and has its own `006_shift_instance_per_type.sql`. Converged chain: keep main's 006–008; renumber peers' file → `009_shift_instance_per_type.sql`. At cutover apply 006–009 to the peers DB — 006–008 create SAP/label tables that sit empty behind disabled flags (empty tables are free). **Standing rule: schema is universal across tenant DBs; features toggle usage, never schema.** Data-level divergence (shift taxonomy, role rows) stays where it belongs: in each tenant's DB.

**Phase 4 — cutover.** Shared runtime on staging with both hostnames; e2e parity run against peers-main prod behavior; repoint the Peers prod hostname; tag `peers-main` as `peers-final-2026` and freeze. The two open §7 ledger items (separate PeersScheduler repo? backup snapshots?) dissolve — Peers lives in `main`, and fleet backups (§4) cover data.

---

## 4. Fleet infrastructure & control plane

### 4.1 Topology — two boxes, ~3 app containers total

| Box | Runs |
|---|---|
| **prod-1** (existing Census EC2 class, t3.medium, 40 GB) | host nginx + certbot, 1–3 `app-prod-*` containers, `fleet-console`, reconciler cron |
| **nonprod-1** (4 GB droplet, replaces the DO test box) | nginx, `app-test-*` + `app-staging-*` containers, one `mysql-nonprod` container (all tenants' `<t>_test`/`<t>_staging` DBs, per-tenant scoped users), Mailpit (non-prod SMTP blackhole) |

- **Normally exactly 3 app containers fleet-wide** (test/staging/prod), regardless of tenant count. A new tenant adds hostnames to existing containers' runtime maps — **zero new containers** (the payoff of §2).
- Prod databases consolidate onto **one RDS instance** with per-tenant databases + per-tenant users (`GRANT ALL ON <db>.* TO <user>` only, no cross-grants) — cheaper than today's two instances, same isolation.
- Resource math at "tens of interactions/day": prod-1 ≈ 1.2 GB RAM worst case; nonprod-1 ≈ 2.5 GB. Comfortable.
- Two boxes, not one: prod stays insulated from test churn (nightly refreshes, main-tracking pulls). One box would work; don't.
- **Images are built once in GitHub Actions** (per release tag + per `main-<sha>`) and pushed to GHCR; boxes only `docker pull`. No on-box builds ever — this ends the build-cache class of incident that filled the Peers box's 20 GB disk (2026-07-22). Prerequisite: multi-stage/standalone rework of `client/Dockerfile` (~2.5 GB → ~250 MB).

### 4.2 Registry + reconciler (new small repo `census-fleet`)

Desired state in one git-tracked `registry.json` (JSON so `jq` parses it):

```json
{
  "image_repo": "ghcr.io/mbhewitt/census-scheduler",
  "boxes": { "prod-1": { "tiers": ["prod"] }, "nonprod-1": { "tiers": ["staging", "test"] } },
  "tenants": {
    "census": {
      "display": "BRC Census",
      "admins": ["mu@burningman.org"],
      "envs": {
        "prod":    { "host": "volunteers.census.burningman.org",         "version": "v2026.09.1",  "db": { "host": "rds",   "name": "census" } },
        "staging": { "host": "volunteers-staging.census.burningman.org", "version": "v2026.09.2",  "db": { "host": "local", "name": "census_staging" } },
        "test":    { "host": "volunteers-test.census.burningman.org",    "version": "track:main",  "db": { "host": "local", "name": "census_test" } }
      }
    },
    "peers": { "…": "same shape; db names peers / peers_staging / peers_test" }
  }
}
```

Secrets are **not** in the registry: per-tenant env files live on-box at `/srv/fleet/secrets/<tenant>/<env>.env` (mode 600), written by onboarding.

`reconcile.sh` — cron `*/5`, per box, structured like today's `census-deploy.sh` (same lockfile/log/prune idioms):

1. Pull the fleet repo; resolve `track:main` to the latest CI image.
2. Compute the needed set of `(tier, version)` pairs for this box; **validate the whole registry first** (unique hostnames, unique db names, secrets present, image tags exist) — invalid registry ⇒ refuse the entire run, alert Discord, leave everything running. A bad commit for tenant A therefore cannot restart or reroute tenant B.
3. For each needed pair with no running container: pull image, generate that container's `tenants.json` runtime map (hostname → db creds/session secret/smtp/data dir, only the tenants pinned to that pair), `docker compose up -d` from a template.
4. Run pending `migrations/` against each tenant DB whose env version advanced (idempotent; requires the expand/contract rule: **migrations must be compatible with the previous app version**, because two versions can be live during a staggered promote — practically, "add columns; don't drop until everyone's promoted").
5. Regenerate nginx vhosts from the registry (hostname → its version-container's port), reload only behind `nginx -t`.
6. GC unreferenced containers; prune images keeping N−1 for instant rollback; write `status/<box>.json` (running versions, health, last refresh) for the dashboard.

No k8s, no daemons, no bus. Failure mode is today's: a log and a Discord webhook line.

### 4.3 Version pinning — **open decision (Mew)**

With a shared runtime, tenants can't each run arbitrary code in one process. Two honest options:

- **(a) One app version per tier.** All tenants on a tier share the code version; the dashboard's "choose your version" applies to the tenant's *config/copy/enabled-features* version. Always exactly 3 app containers. Simplest ops; a tenant can never lag or lead a release.
- **(b) Capped per-version containers** *(recommended)*. The registry allows per-tenant×env pins. When all pins agree (steady state) this **is** option (a) — 3 containers. When pins diverge (Census promotes prod to `v2026.09.2`, Peers stays on `v2026.09.1`), the reconciler runs a second prod container and nginx routes each hostname to its version; cap 3 distinct versions per tier. Containers scale with *versions in use*, never tenant count. Cost: ~400 MB RAM per extra live version, briefly. Benefit: the per-tenant "which version do I present" dashboard control is real, and **promote = an nginx flip — zero downtime, no rebuild**.

Recommendation is (b) because (a) is its degenerate case — the registry/reconciler design is identical, (b) just doesn't refuse divergent pins. Decide before the fleet repo is built; the difference is ~30 lines of reconciler.

### 4.4 Routing, TLS, DNS

- Host-installed nginx (as prod today; keeps certbot's nginx plugin unchanged). App containers bind loopback ports (prod tier 31xx, staging 32xx, test 33xx, console 3900).
- Hostname scheme: `volunteers.<group>.burningman.org` (prod, unchanged for both live tenants) + `volunteers-staging.` / `volunteers-test.` variants.
- TLS: per-hostname certbot http-01, scripted (`fleet certs <tenant>`). Wildcard would need DNS-01 + zone control — see below.
- **External dependencies to flag:** every new hostname is (1) a **BM IT ticket** for the A record and (2) a **BM Okta admin ticket** for the exact redirect URI `https://<host>/api/auth/okta/callback`. Optional ask worth making once: delegate `census.burningman.org` / `peers.burningman.org` zones (NS records) to a Route53 zone we control — DNS becomes self-serve and wildcard certs become possible. The design does not depend on it.

### 4.5 Meta dashboard

**Phase 1 is a CLI** (`fleet.sh` in the fleet repo): `fleet status`, `fleet promote census staging prod`, `fleet rollback census prod`, `fleet pin census test v2026.09.1`, `fleet refresh-db census staging`. Each is a registry edit + commit (`promote(census): prod → v2026.09.2 by <user>`); the reconciler applies within 5 min.

**Phase 2, `fleet-console`:** a tiny standalone Next app on prod-1 (`fleet.census.burningman.org`, port 3900). Deliberately **not** a page inside the scheduler: the control plane must survive a broken tenant deploy, and it spans tenants/tiers, which a tenant-scoped app page can't cleanly do. Auth: BM Okta, then authorization from the registry's per-tenant `admins` lists (tenant admins see/act on their tenant; a fleet-ops list sees all). Shows per env: pinned vs actually-running version, available versions (CI tag list), config diff between envs, health, last DB refresh. Actions: promote / rollback / pin / edit settings / refresh test DB / restart-now.

**Write flow (decided):**
- **Version promote/rollback/pin → direct commits** to `census-fleet`, authored as the acting admin (git log = audit trail; instant rollback is the point).
- **Tenant settings/copy/feature changes → PRs to CensusScheduler** requiring tenant-admin approval — the same governance as the agent-channel flow today.
- Only non-git actions: "restart env now" / "rollback now" (console shells docker directly, then reconciles) — when things are on fire you don't wait for a cron tick.

### 4.6 Environments & data

- **test:** nightly per-tenant refresh — dump prod (RDS) → load `<tenant>_test` → run that tenant's PII scrub (generalize the existing `blank_pii.sql` into `tenants/<id>/scrub.sql`). Replaces the DO droplet's OnPlayaData flow for hosted test; test envs pin `track:main` so they auto-follow merges within ~5 min (replacing the droplet's git-poll rebuild).
- **staging:** refreshed on demand (button/CLI) from the same scrubbed dump — fresh when it matters, right before promotion testing.
- **Non-prod email:** SMTP pointed at Mailpit (web UI on the ops hostname) — belt-and-suspenders on top of PII-blanked addresses.
- **promote** = registry commit moving a tag reference (no rebuild, no data movement). **rollback** = revert commit; N−1 image is still on disk, <1 min flip.

### 4.7 Change flow with agents (the gates)

1. Claude agent in a team channel opens a PR — code behind a flag, or the team's own `tenants/<id>/` files. **Gate 1: tenant admin approves/merges** (CODEOWNERS + the `tenant:<id>` CI check make scope violations mechanical).
2. Merge → CI builds `main-<sha>` → every `track:main` test env is running it ≤5 min later. No gate; test is for looking.
3. Admin cuts a release tag when ready. **Gate 2: promote to staging** (a registry commit under their identity).
4. **Gate 3: promote staging → prod.** Same mechanism.
5. **Cross-pollination:** tenant B enables tenant A's feature by flipping a flag in *their own* config.json via PR (Gate 1). Never a branch, never someone else's directory.

### 4.8 Onboarding wizard

`fleet onboard <slug>` CLI first (a console form later shells the same script). Inputs: slug, display name, admin emails, SMTP (or shared relay). Automated (~15 min): registry entries for 3 envs (`track:main` test, current stable tag staging/prod); secrets generated on both boxes; 3 DBs + scoped users created and schema-seeded; `tenants/<slug>/` scaffolded from a template as a CensusScheduler PR. Printed manual checklist: ① BM IT: 3 A records; ② Okta: 3 redirect URIs; ③ `fleet certs <slug>` after DNS resolves; ④ first admin login. **~1 hour of ops time; wall-clock gated by the BM IT/Okta tickets (days).** No new containers.

---

## 5. Migration timeline (post-event)

App freeze has been in effect since 2026-07-19; the event is late Aug. **No prod topology changes before ~Sep 8.** Sequencing dependency: fleet steps 3+ require the §2 runtime-tenant layer merged and proven.

| When | Step |
|---|---|
| **Now** | This doc reviewed. Optionally (Mew's call): file the long-lead BM IT DNS + Okta redirect tickets for the staging/test hostnames, and the zone-delegation ask — tickets take weeks and are inert until used. |
| **Sep wk 1** | Create `census-fleet`; GitHub Actions image builds → GHCR; multi-stage Dockerfile; registry describing *current reality*; reconciler in check-only mode. Stand up nonprod-1 serving both tenants' test+staging from scrubbed dumps; run in parallel with the DO droplet, then retire it. Phase-0 tenantization PRs land on `main`. |
| **Sep wk 2** | **Peers prod converts first** (smaller blast radius): reconciler + pull-only images on the existing Peers EC2; same hostname/IP → no DNS/Okta changes; cutover = one container swap at a quiet hour. Phases 1–3 of §3 proceed. |
| **Sep wk 3** | Census EC2 becomes prod-1; Peers prod hostname migrates onto it (one DNS change, no Okta change); consolidated RDS; old Peers EC2 + DO droplet decommissioned; `fleet-console` deployed. Retire `census-deploy.sh`/`deploy/test-bundle` flows. |

---

## 6. Open decisions (Mew)

1. **Version pinning (a) vs (b)** — §4.3. Recommended: (b), capped.
2. **Staging tier for everyone from day one?** Test+prod might suffice initially; staging can be added per tenant when promotion discipline demands it (it's a registry entry + a hostname, cheap either way).
3. **File the BM IT zone-delegation ask?** Unlocks self-serve DNS + wildcard TLS; not required.
4. **Fleet-console hostname** (`fleet.census.burningman.org` vs something neutral like `fleet.<something>.burningman.org` — cosmetic, but it's an Okta ticket either way).

---

## 7. Requirements traceability

- Every `PEERS_TODO.md` section maps to a §2.2 config key, a §2.6 override, a §2.5 flag, or fleet templates (see the Phase-2 table in §3).
- The tenant-config issue's five deliverables: taxonomy (§2.2 close), storage (§2.1: config-as-code, DB table explicitly rejected with the migration seam noted), checklist-item model (§2.2 close — delegated to tiers, bespoke schema deferred), eligibility-rule model (§2.2 `rules.eligibility`), migration strategy (§3, §5).
- #237 (roles/permissions config): the role-ID slice is `TenantConfig.roles`; permission *semantics* stay structural (shared code), which matches that issue's scope note.
