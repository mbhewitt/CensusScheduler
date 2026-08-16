# Census Hive Courses — Offline Export

A point-in-time export of the five 2026 Census courses from
[Burning Man Hive](https://hive.burningman.org), packaged so the CensusScheduler
tablet app can serve them with no internet connection.

**Exported:** 2026-08-16 · **Source:** Burning Man Hive (Mighty Networks)

## What's here

Six courses, in the order a volunteer moves through them:

| Course | Sections | Lessons | Quizzes | Questions |
|---|---:|---:|---:|---:|
| Census Welcome and Overview | 6 | 14 | 0 | 0 |
| 2026 Census Course: Basics | 3 | 8 | 0 | 0 |
| 2026 Census Course: Outreach | 4 | 8 | 2 | 13 |
| 2026 Census Course: Random Sampling | 6 | 20 | 4 | 41 |
| 2026 Census Course: Databeast Driver | 3 | 5 | 2 | 10 |
| 2026 Census Course: Data Entry Wiz | 2 | 5 | 0 | 0 |
| **Total** | **24** | **60** | **8** | **64** |

Roughly 22,300 words of instructional text, 104 in-content images and 8 audio
clips. All 98 content items from Hive are present — nothing was dropped.

"Census Welcome and Overview" is the community space
(`spaces/14264554`) rather than a course space, but it is authored with the same
structure and acts as the jumping-off point, so it is exported the same way and
listed first.

## Layout

```
client/public/training/
  index.json              course list for a menu screen
  courses/<slug>.json     one file per course, full content
  assets/                 161 images + audio, 53 MB
client/src/app/training/
  TrainingCourse.tsx      reference renderer (MUI, matches Help.tsx)
migrations/
  013_training_offline_urls.sql
```

The folder mirrors its destination in the repo. Copy `client/public/training`
into `CensusScheduler/client/public/` and everything resolves at `/training/...`
with no build step and no network calls.

The full-resolution downloads (125 MB) are kept outside this folder in
`../originals/` as an archive. They are **not** needed by the app — images in
`assets/` are capped at 1600px, which is plenty for a tablet.

## Data shape

`index.json`:

```jsonc
{
  "exportedAt": "2026-08-16T02:55:14.305Z",
  "source": "Burning Man Hive",
  "courses": [
    {
      "slug": "basics",
      "title": "2026 Census Course: Basics",
      "summary": "Required course for ALL Census volunteer positions.",
      "image": "/training/assets/....png",
      "counts": { "sections": 3, "lessons": 8, "quizzes": 0, "questions": 0 },
      "file": "/training/courses/basics.json"
    }
  ]
}
```

`courses/<slug>.json`:

```jsonc
{
  "slug": "basics",
  "spaceId": 23489224,
  "title": "2026 Census Course: Basics",
  "titleFromHive": "2026 Census Course: Basics",
  "titleWasTruncatedInHive": false,
  "summary": "...",
  "sourceUrl": "https://hive.burningman.org/spaces/23489224/content",
  "overview": { /* node — the course intro */ },
  "sections": [
    {
      /* node fields */
      "title": "Ready, Set, Go: Preparing and Arriving for your Shift",
      "lessons": [ /* nodes, in order */ ],
      "quizzes": [ /* nodes + questions */ ]
    }
  ],
  "counts": { "sections": 3, "lessons": 8, "quizzes": 0, "questions": 0 }
}
```

Every **node** (overview, section, lesson, quiz) has the same base shape:

```jsonc
{
  "id": 100845454,
  "slug": "census-course-basics-gear-up-for-your-shift-100845454",
  "title": "Gear Up for Your Shift",
  "position": 1,
  "image": "/training/assets/e883f294-Copy_of_68252_307_273.png",  // or null
  "audio": [{ "name": "...", "src": "/training/assets/....mp3" }],
  "attachments": [{ "name": "...", "href": "..." }],
  "blocks": [ /* see below */ ],
  "updatedAt": "2026-07-08T16:44:27Z"
}
```

### Blocks

`blocks` is an ordered array — render it top to bottom. Six types:

```jsonc
{ "type": "heading",   "level": 4, "text": "What to Wear" }
{ "type": "paragraph", "text": "...", "links": [ { "text": "...", "href": "...", "kind": "external" } ] }
{ "type": "list",      "ordered": false, "items": ["...", "..."] }
{ "type": "image",     "src": "/training/assets/....png", "alt": "" }
{ "type": "quote",     "text": "..." }
{ "type": "table",     "rows": [["cell", "cell"], ["cell", "cell"]] }
```

`links[].kind` is one of:

| kind | count | resolves offline? |
|---|---:|---|
| `asset` | 6 | yes — a file in `/training/assets` |
| `course` | 13 | yes — another course, e.g. `/training/outreach` |
| `email` | 10 | yes — `mailto:`, hands off to a mail client |
| `external` | 34 | **no** — an outside site |
| `hive` | 1 | **no** — a Hive space we didn't export |

Links between the six courses are rewritten to in-app routes, so "start with
Census Basics" still works with no internet.

The 34 external links are overwhelmingly the Welcome course's press and academic
citation lists (Guardian, Atlantic, journal articles) — reference material, not
operational content. The single `hive` link is the Rangers' Conflict Resolution
course, which lives in a different Hive space. Render these as plain text or
styled-unavailable rather than dead links — see the reference component.

### Quizzes

Quiz nodes add a `questions` array. Every question has exactly one correct
choice, and all 64 have an answer flagged.

```jsonc
{
  "id": 100845476,
  "text": "In which of the following location(s) does BRC Census NOT share our Data Results?",
  "image": null,
  "choices": [
    { "id": 6407550, "text": "At Census Lab", "correct": false },
    { "id": 6407553, "text": "None of the above", "correct": true }
  ]
}
```

Note the answer key ships in the JSON. That's fine for self-check practice —
but it is readable by anyone who opens the file, so don't treat these quizzes as
proctored assessment.

## Recording course completion

Every course ends with a section headed *"PLEASE CLICK THE BUTTON BELOW TO
RECORD YOUR COMPLETION OF THIS COURSE"* followed by a button. In Hive that
button is an image wrapped in a link out to the volunteering site — and the
export captured the image but **not** its href, because the anchor had no text.
That's fine, because the link is being replaced anyway.

The app already has everything needed to take this over:

- Route: `client/src/app/training/confirmation/[code]/`
- It is wrapped in `AuthGate` (`ACCOUNT_TYPE_AUTHENTICATED`)
- `op_trainings` maps each course to a `code` and the role granted on completion

So the button becomes an in-app link to `/training/confirmation/<code>`:

| Course | `op_trainings.training_name` | code | role granted |
|---|---|---|---|
| basics | Census Basics | `XQDDG` | TrainingCensusBasicsComplete |
| random-sampling | Random Sampling | `AH73H` | TrainingRandomSamplingComplete |
| outreach | OutReach | `XQ9VD` | TrainingOutReachComplete |
| data-entry | DataEntry Wiz | `TMBSW` | TrainingDataEntryWizComplete |
| databeast | DataBeast Driver | `PZBWG` | TrainingDataBeastDriverComplete |
| welcome | — | — | **no row exists yet** |

`TrainingCourse.tsx` renders this via an optional `confirmationCode` prop.
Resolve the code server-side from `op_trainings` rather than baking it into the
exported JSON, so the database stays the single source of truth.

Two things to decide:

1. **Confirmation happens on page load, not on a click.** `TrainingConfirmation`
   auto-fires the POST from a `useEffect` as soon as the GET resolves. On a
   personal device that's fine. On a shared lab tablet it means whoever is
   signed in at that moment gets the credit — including someone who lands there
   by back-button or by picking up a tablet mid-session. If that's a concern,
   restore an explicit confirm click for the tablet case.
2. **The Welcome course has a completion button but no `op_trainings` row**, so
   there is nothing for it to confirm against. `migrations/013_training_offline_urls.sql`
   includes a commented-out insert if you want to track it.

That migration also repoints `op_trainings.url` at the offline routes. Those
values currently hold public Hive URLs (and a Google Drive PDF for Data Entry),
which is what the completed-checklist item links to for reviewing material later
— none of which load on playa.

One related copy change: `TrainingConfirmation.tsx` ends with "you can return to
the course on Hive or view/print a PDF copy of the course." Neither is true
offline; that line should point at `/training/<slug>` instead.

## Wiring it into the app

The repo already has a `client/src/app/training/` route and follows the pattern
in [`Help.tsx`](../client/src/app/help/Help.tsx) — MUI, accordion sections, a
`Hero` header. `TrainingCourse.tsx` in this export is a reference renderer built
to match that style. To use it:

1. Copy `client/public/training/` → `CensusScheduler/client/public/training/`
2. Copy `client/src/app/training/TrainingCourse.tsx` → the same path in the repo
3. Add routes that read the JSON, e.g. `app/training/page.tsx` (list from
   `index.json`) and `app/training/[slug]/page.tsx` (render one course)

Because the files live in `public/`, a plain `fetch("/training/index.json")`
works offline. For a fully static build you can instead import the JSON directly
so it is bundled at build time.

## Caveats

- **Three course titles were truncated in Hive itself.** Hive stores space names
  cut off at ~30 characters, so the source data literally reads
  `2026 Census Course: Random Sam...`. The full names here were taken from each
  course's own overview lesson ("Random Sampling Course Overview", "Databeast
  Driver Course Overview", "Data Entry Wiz Overview"). Those three carry
  `titleWasTruncatedInHive: true` — please confirm they read the way you want.
- **This is a snapshot.** If a course is edited in Hive, re-run the export.
- **HEIC images were transcoded to JPEG** (3 files) since browsers can't display
  HEIC.
- **Member discussion and comments were not exported** — course material only.
- **Hive's own completion tracking does not come across** (and isn't needed —
  the app records completion itself; see above).
- The Welcome course's "Training Manuals" and "Shift Lead Resources" lessons list
  guide names as headings — **2026 Random Sampling Guide**, **Gate Sampling 2026
  Shift Lead Guide**, and so on — with no attached files or links in Hive. If
  those PDFs should be available on playa, they need to be added separately.

## Provenance

The content came from Hive's own web API (`/api/web/v1/...`) read through an
authenticated browser session, not scraped from rendered HTML — so the structure
(sections, lesson order, quiz answer keys) is exactly what Hive stores.

Raw unmodified pulls are kept in `../raw/` for re-processing:

- `hive_export_raw.json` — courses, sections, lessons, parsed blocks
- `hive_quizzes_raw.json` — quiz questions and choices
- `media-manifest.json` — original media URL → local filename
