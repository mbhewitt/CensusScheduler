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

// The Hive export left HTML entities (&amp;, &nbsp;, …) in the text, which React
// renders as LITERAL characters ("you &amp; me" instead of "you & me"). Decode
// them once at load so every course/lesson/quiz string is clean. Reported via
// the Contact form (#32, Chipper 2026-08-31). `&amp;` is decoded last so a
// double-encoded "&amp;lt;" resolves to "&lt;", not "<".
const decodeEntities = (s: string): string =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/(&#0*39;|&apos;)/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const decodeDeep = (v: any): any => {
  if (typeof v === "string") return decodeEntities(v);
  if (Array.isArray(v)) return v.map(decodeDeep);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) out[k] = decodeDeep(val);
    return out;
  }
  return v;
};

const readJson = async <T>(...segments: string[]): Promise<T | null> => {
  try {
    const parsed = JSON.parse(
      await readFile(path.join(TRAINING_DIR, ...segments), "utf8")
    );
    return decodeDeep(parsed) as T;
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
