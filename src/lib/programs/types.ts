/**
 * The beginner program library: the classic first-year syllabus programs
 * (lab-file programs), each written in every language of
 * `PROGRAM_LANGUAGES`, with an explanation for someone who has never
 * programmed. One file per program in ./topics, listed in order in
 * ./index.ts; CONTRIBUTING.md explains how to add one.
 */
import type { Level } from "@/types/playground";

export type { Level };

export const LEVELS: readonly { id: Level; name: string }[] = [
  { id: "beginner", name: "Beginner" },
  { id: "intermediate", name: "Intermediate" },
  { id: "advanced", name: "Advanced" },
];

/**
 * Languages every program is written in. A language listed here that the
 * playground cannot run yet keeps its code in the data, but gets no pages,
 * links or menu entries until it can (see `runnableLanguages`).
 */
export const PROGRAM_LANGUAGES = ["python", "c", "cpp", "java"] as const;
export type ProgramLanguage = (typeof PROGRAM_LANGUAGES)[number];

/** Groups on the examples page, in syllabus order. */
export const PROGRAM_TOPICS = [
  "Basics",
  "Decisions",
  "Loops",
  "Patterns",
  "Number programs",
  "Arrays",
  "Strings",
  "Functions and recursion",
] as const;
export type ProgramTopic = (typeof PROGRAM_TOPICS)[number];

export interface Program {
  /**
   * URL slug: the page is /examples/<language>/<slug> and the playground
   * example id is <share code>-<slug> (e.g. `py-prime-number`). Never change
   * one once published: links to it would break.
   */
  slug: string;
  level: Level;
  topic: ProgramTopic;
  /** Short name for lists and the editor's Examples menu: "Prime number". */
  name: string;
  /** One line for lists: "Checks whether a number is prime". */
  summary: string;
  /**
   * Page heading and title, phrased the way students search, with
   * `{language}` for the language's name: "Prime Number Program in
   * {language}".
   */
  heading: string;
  /**
   * Meta description with `{language}`: what the program does and that it
   * runs in the browser. Keep it under 160 characters once filled in.
   */
  description: string;
  /** What the program does and the idea behind it, for a total beginner. */
  explanation: string[];
  /** How the program works, step by step. */
  steps: string[];
  /** Tips that only apply to one language (e.g. the `&` in C's scanf). */
  notes?: Partial<Record<ProgramLanguage, string[]>>;
  /** Text put in the Input tab when the example opens (programs that read input). */
  stdin?: string;
  /**
   * The exact output for `stdin`, the same in every language. Checked
   * against real runs by tests/e2e/programs.spec.ts.
   */
  output: string;
  /** Well-commented code per language. */
  code: Partial<Record<ProgramLanguage, string>>;
}
