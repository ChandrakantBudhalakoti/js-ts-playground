import { isLanguage, languageInfo } from "@/lib/languages";
import type { CodeExample, Language } from "@/types/playground";
import { program as armstrongNumber } from "./topics/armstrong-number";
import { program as arraySumMax } from "./topics/array-sum-max";
import { program as bubbleSort } from "./topics/bubble-sort";
import { program as evenOdd } from "./topics/even-odd";
import { program as factorial } from "./topics/factorial";
import { program as fibonacciSeries } from "./topics/fibonacci-series";
import { program as floydsTriangle } from "./topics/floyds-triangle";
import { program as gcdRecursion } from "./topics/gcd-recursion";
import { program as helloWorld } from "./topics/hello-world";
import { program as inputOutput } from "./topics/input-output";
import { program as largestOfThree } from "./topics/largest-of-three";
import { program as linearSearch } from "./topics/linear-search";
import { program as matrixAddition } from "./topics/matrix-addition";
import { program as multiplicationTable } from "./topics/multiplication-table";
import { program as palindromeNumber } from "./topics/palindrome-number";
import { program as primeNumber } from "./topics/prime-number";
import { program as reverseNumber } from "./topics/reverse-number";
import { program as simpleCalculator } from "./topics/simple-calculator";
import { program as starPatternInvertedTriangle } from "./topics/star-pattern-inverted-triangle";
import { program as starPatternPyramid } from "./topics/star-pattern-pyramid";
import { program as stringReverseVowels } from "./topics/string-reverse-vowels";
import { program as variablesDataTypes } from "./topics/variables-data-types";
import { PROGRAM_LANGUAGES, type Program, type ProgramLanguage } from "./types";

export * from "./types";

/** Every program, in syllabus order. Add new ones here. */
export const PROGRAMS: readonly Program[] = [
  helloWorld,
  inputOutput,
  variablesDataTypes,
  evenOdd,
  largestOfThree,
  multiplicationTable,
  starPatternPyramid,
  starPatternInvertedTriangle,
  floydsTriangle,
  primeNumber,
  factorial,
  fibonacciSeries,
  reverseNumber,
  palindromeNumber,
  armstrongNumber,
  arraySumMax,
  linearSearch,
  bubbleSort,
  matrixAddition,
  stringReverseVowels,
  simpleCalculator,
  gcdRecursion,
];

/** Program languages the playground can run (pages and links exist for these). */
export function runnableLanguages(): (ProgramLanguage & Language)[] {
  return PROGRAM_LANGUAGES.filter(
    (language): language is ProgramLanguage & Language => isLanguage(language),
  );
}

/** The path segment of a language's program pages: /examples/<segment>/... */
export function languageSegment(language: Language): string {
  return languageInfo(language).path.slice(1);
}

export function languageForSegment(segment: string): Language | undefined {
  return runnableLanguages().find(
    (language) => languageSegment(language) === segment,
  );
}

export function isProgramLanguage(value: string): value is ProgramLanguage {
  return (PROGRAM_LANGUAGES as readonly string[]).includes(value);
}

/** A program's code in a language, if it has been written in it. */
export function programCode(
  program: Program,
  language: Language,
): string | undefined {
  return isProgramLanguage(language) ? program.code[language] : undefined;
}

/** Tips about a program that only apply to one language. */
export function programNotes(program: Program, language: Language): string[] {
  return (isProgramLanguage(language) && program.notes?.[language]) || [];
}

export function findProgram(slug: string): Program | undefined {
  return PROGRAMS.find((program) => program.slug === slug);
}

/** `{language}` in a heading or description, filled in. */
export function forLanguage(text: string, language: Language): string {
  return text.replaceAll("{language}", languageInfo(language).name);
}

export function programPath(program: Program, language: Language): string {
  return `/examples/${languageSegment(language)}/${program.slug}`;
}

export function programExampleId(program: Program, language: Language) {
  return `${languageInfo(language).shareCode}-${program.slug}`;
}

/** Every program page and each language's list of them (for the sitemap). */
export function programPaths(): string[] {
  return runnableLanguages().flatMap((language) => [
    `/examples/${languageSegment(language)}`,
    ...PROGRAMS.filter((program) => programCode(program, language)).map(
      (program) => programPath(program, language),
    ),
  ]);
}

/** Every program in every runnable language, as playground examples. */
export const PROGRAM_EXAMPLES: CodeExample[] = PROGRAMS.flatMap((program) =>
  runnableLanguages().flatMap((language): CodeExample[] => {
    const code = program.code[language];
    if (!code) return [];
    return [
      {
        id: programExampleId(program, language),
        title: program.name,
        description: program.summary,
        language,
        code,
        level: program.level,
        ...(program.stdin ? { stdin: program.stdin } : {}),
      },
    ];
  }),
);
