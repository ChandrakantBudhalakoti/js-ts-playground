import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXAMPLES, findExample } from "@/lib/examples";
import { languageInfo } from "@/lib/languages";
import {
  forLanguage,
  PROGRAM_EXAMPLES,
  PROGRAM_LANGUAGES,
  programExampleId,
  programPaths,
  PROGRAMS,
  runnableLanguages,
} from "@/lib/programs";

const TOPICS_DIR = join(import.meta.dirname, "../../src/lib/programs/topics");

/** What reads standard input in each language. */
const READS_INPUT = /\binput\(|scanf\(|fgets\(|\bcin\b|getline\(|Scanner\(/;

describe("beginner programs", () => {
  it("lists every file in topics/ once, with a unique slug", () => {
    const files = readdirSync(TOPICS_DIR)
      .filter((name) => name.endsWith(".ts"))
      .map((name) => name.replace(/\.ts$/, ""));
    const slugs = PROGRAMS.map((program) => program.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.toSorted()).toEqual(files.toSorted());
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(PROGRAMS.map((program) => [program.slug, program] as const))(
    "%s is complete in every language",
    (_slug, program) => {
      for (const language of PROGRAM_LANGUAGES) {
        expect(program.code[language], language).toBeTruthy();
        expect(program.code[language], language).not.toContain("${");
      }
      expect(program.heading).toContain("{language}");
      expect(program.description).toContain("{language}");
      for (const language of runnableLanguages()) {
        const description = forLanguage(program.description, language);
        expect(description.length, description).toBeLessThanOrEqual(160);
      }
      expect(program.summary.length).toBeLessThanOrEqual(60);
      expect(program.explanation.length).toBeGreaterThan(0);
      expect(program.steps.length).toBeGreaterThan(0);
      // The browser test compares the console with this exactly.
      expect(program.output.trim()).not.toBe("");
      for (const line of program.output.split("\n"))
        expect(line, "trailing space").toBe(line.trimEnd());
    },
  );

  it.each(PROGRAMS.map((program) => [program.slug, program] as const))(
    "%s has sample input exactly when it reads input",
    (_slug, program) => {
      const reads = Object.values(program.code).some((code) =>
        READS_INPUT.test(code ?? ""),
      );
      expect(Boolean(program.stdin)).toBe(reads);
      if (program.stdin) expect(program.stdin.endsWith("\n")).toBe(true);
    },
  );

  it("opens in the playground with its sample input", () => {
    const ids = EXAMPLES.map((example) => example.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const program of PROGRAMS) {
      for (const language of runnableLanguages()) {
        const example = findExample(programExampleId(program, language));
        expect(example?.code).toBe(program.code[language]);
        expect(example?.stdin).toBe(program.stdin);
        expect(example?.level).toBe(program.level);
      }
    }
    expect(PROGRAM_EXAMPLES).toHaveLength(
      PROGRAMS.length * runnableLanguages().length,
    );
  });

  it("has a page per program and language, and a list per language", () => {
    const paths = programPaths();
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toHaveLength(
      runnableLanguages().length * (PROGRAMS.length + 1),
    );
    expect(paths).toContain("/examples/c/prime-number");
    expect(paths).toContain("/examples/python");
    for (const language of runnableLanguages())
      expect(paths).toContain(`/examples${languageInfo(language).path}`);
  });
});
