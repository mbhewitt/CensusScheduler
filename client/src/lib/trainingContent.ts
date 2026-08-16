// Server-only: reads from the filesystem. Import this from server components
// and route handlers, never from a "use client" module.
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Course, CourseIndexEntry } from "@/components/types/training";
import { isValidCourseSlug } from "@/lib/training";

// The exported courses live in public/ so the browser can also fetch the
// images and PDFs by URL. Server-side we read them straight off disk: no
// self-fetch, which means this works during `next build` prerendering and
// needs no network at all.
const TRAINING_DIR = path.join(process.cwd(), "public", "training");

const readJson = async <T>(...segments: string[]): Promise<T | null> => {
  try {
    return JSON.parse(await readFile(path.join(TRAINING_DIR, ...segments), "utf8")) as T;
  } catch {
    // Missing bundle is expected off-playa — the caller renders a 404.
    return null;
  }
};

export const getCourseIndex = async () => {
  const data = await readJson<{ courses: CourseIndexEntry[] }>("index.json");
  return data?.courses ?? [];
};

export const getCourse = async (slug: string) => {
  if (!isValidCourseSlug(slug)) return null;
  return readJson<Course>("courses", `${slug}.json`);
};
