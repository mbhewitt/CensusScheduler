// Offline training courses.
//
// The five Hive courses plus the Welcome community space are exported into
// client/public/training so the on-playa tablets can serve them with no
// internet. Off-playa nothing changes: volunteers still go to Hive, which is
// the authoritative copy and the one that gets edited.

// This module is imported by client components, so it must stay free of any
// node-only imports. The course JSON is loaded in lib/trainingContent.ts,
// which is server-only.

/**
 * True when this build is the on-playa (offline) deployment.
 *
 * Reuses the existing signal rather than adding another flag: PIN sign-in is
 * enabled on-playa and disabled everywhere else, which is the same test
 * VolunteerInfo already uses to hide links that can't load out there.
 */
export const isOnPlaya = () => process.env.NEXT_PUBLIC_PIN_ENABLED !== "false";

/**
 * op_trainings.code -> exported course slug.
 *
 * Kept here rather than in the database so that op_trainings.url continues to
 * hold the Hive URL, which is still what off-playa volunteers should get. On
 * playa we swap in the local route at render time.
 */
export const TRAINING_CODE_TO_SLUG: Record<string, string> = {
  XQDDG: "basics",
  AH73H: "random-sampling",
  XQ9VD: "outreach",
  TMBSW: "data-entry",
  PZBWG: "databeast",
  WELCM: "welcome",
};

/** Exported course slug -> op_trainings.code, for the completion button. */
export const slugToTrainingCode = (slug: string) =>
  Object.entries(TRAINING_CODE_TO_SLUG).find(([, s]) => s === slug)?.[0];

/** The Welcome community space on Hive, linked from the account checklist. */
export const WELCOME_HIVE_URL = "https://hive.burningman.org/spaces/14264554";

/**
 * Where a training's "review the material" link should point.
 * On playa: the bundled copy. Off playa: whatever the database says (Hive).
 */
export const trainingMaterialHref = (code: string, dbUrl: string | null) => {
  const slug = TRAINING_CODE_TO_SLUG[code];
  if (isOnPlaya() && slug) return `/training/${slug}`;
  return dbUrl;
};

/** Course slugs are used as path segments and filenames — keep them tight. */
export const isValidCourseSlug = (slug: string) => /^[a-z0-9-]{1,64}$/.test(slug);
