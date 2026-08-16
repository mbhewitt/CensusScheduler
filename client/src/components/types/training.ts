// Types for the offline training courses exported from Burning Man Hive into
// client/public/training. See client/public/training/README.md for the schema
// and how the export was produced.

export type ILinkKind = "asset" | "course" | "email" | "hive" | "external";

export interface ILink {
  text: string;
  href: string;
  kind: ILinkKind;
}

export type IBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string; links?: ILink[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; src: string; alt: string }
  | { type: "quote"; text: string }
  | { type: "table"; rows: string[][] }
  | { type: "document"; title: string; href: string; sizeKb: number };

export interface IQuestion {
  id: number;
  text: string;
  image: string | null;
  choices: { id: number; text: string; correct: boolean }[];
}

export interface INode {
  id: number;
  slug: string;
  title: string;
  position: number;
  image: string | null;
  audio: { name: string; src: string }[];
  attachments: { name: string; href: string }[];
  blocks: IBlock[];
  updatedAt: string;
}

export type IQuiz = INode & { questions: IQuestion[] };
export type ISection = INode & { lessons: INode[]; quizzes: IQuiz[] };

export interface ICourseCounts {
  sections: number;
  lessons: number;
  quizzes: number;
  questions: number;
}

export interface Course {
  slug: string;
  spaceId: number;
  title: string;
  titleFromHive: string;
  titleWasTruncatedInHive: boolean;
  summary: string;
  sourceUrl: string;
  exportedAt: string;
  overview: INode | null;
  sections: ISection[];
  ungroupedLessons?: INode[];
  ungroupedQuizzes?: IQuiz[];
  counts: ICourseCounts;
}

export interface CourseIndexEntry {
  slug: string;
  title: string;
  summary: string;
  image: string | null;
  counts: ICourseCounts;
  file: string;
}
