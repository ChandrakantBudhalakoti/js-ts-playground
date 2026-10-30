import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { playgroundHref } from "@/lib/examples";
import { languageInfo } from "@/lib/languages";
import { pageMetadata } from "@/lib/metadata";
import {
  forLanguage,
  LEVELS,
  type Program,
  programCode,
  programExampleId,
  programNotes,
  programPath,
  PROGRAMS,
  runnableLanguages,
  languageSegment,
} from "@/lib/programs";
import type { Language } from "@/types/playground";
import { Breadcrumbs } from "./Breadcrumbs";
import { CodeBlock } from "./CodeBlock";
import { PageHeader } from "./PageHeader";
import { PlaygroundLink } from "./PlaygroundLink";
import { Section } from "./Section";

export function programMetadata(
  language: Language,
  program: Program,
): Metadata {
  return pageMetadata({
    title: forLanguage(program.heading, language),
    description: forLanguage(program.description, language),
    path: programPath(program, language),
  });
}

/** Path and heading of a language's list of beginner programs. */
export function programListPage(language: Language) {
  const name = languageInfo(language).name;
  return {
    path: `/examples/${languageSegment(language)}`,
    heading: `${name} Programs for Beginners`,
  };
}

const SECTION = "py-8 sm:py-10";

/**
 * A beginner program's page: what it does, the code, a sample input and
 * its output, how it works, and the same program in other languages.
 */
export function ProgramArticle({
  language,
  program,
}: {
  language: Language;
  program: Program;
}) {
  const info = languageInfo(language);
  const code = programCode(program, language) ?? "";
  const heading = forLanguage(program.heading, language);
  const href = playgroundHref(programExampleId(program, language));
  const list = programListPage(language);
  const level = LEVELS.find(({ id }) => id === program.level)?.name;
  const notes = programNotes(program, language);

  const inLanguage = PROGRAMS.filter((other) => programCode(other, language));
  const index = inLanguage.indexOf(program);
  const previous = inLanguage[index - 1];
  const next = inLanguage[index + 1];
  const otherLanguages = runnableLanguages().filter(
    (other) => other !== language && programCode(program, other),
  );

  const open = (
    <PlaygroundLink href={href}>
      <Play className="fill-current" aria-hidden />
      Open in the playground
    </PlaygroundLink>
  );

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6">
      <PageHeader
        above={
          <Breadcrumbs
            crumbs={[
              { name: "Home", path: "/" },
              { name: "Examples", path: "/examples" },
              { name: `${info.name} programs`, path: list.path },
              { name: program.name, path: programPath(program, language) },
            ]}
          />
        }
        heading={heading}
        lead={
          <>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {level} · {program.topic}
            </p>
            {program.explanation.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </>
        }
        actions={
          <Button asChild size="lg" className="h-10 px-4">
            {open}
          </Button>
        }
      />

      <Section
        id="code"
        heading={`${info.name} code`}
        intro={
          <p>
            {info.fileName}. This is exactly what opens in the playground
            {program.stdin ? ", with the sample input in the Input tab" : ""}.
          </p>
        }
        className={SECTION}
      >
        <CodeBlock code={code} label={info.fileName} />
      </Section>

      {program.stdin && (
        <Section
          id="input"
          heading="Sample input"
          intro="The program reads this from the Input tab. Change it in the playground to try other values."
          className={SECTION}
        >
          <CodeBlock code={program.stdin} label="Sample input (Input tab)" />
        </Section>
      )}

      <Section
        id="output"
        heading="Output"
        intro={
          program.stdin
            ? "What the program prints for the sample input."
            : "What the program prints."
        }
        className={SECTION}
      >
        <CodeBlock code={program.output} label="Program output" />
      </Section>

      <Section id="how-it-works" heading="How it works" className={SECTION}>
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-muted-foreground">
          {program.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      {notes.length > 0 && (
        <Section
          id="tips"
          heading={`Tips for ${info.name}`}
          className={SECTION}
        >
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        id="try-it"
        heading="Try it yourself"
        intro="Open the program, press Run, then change the input or the code and run it again."
        className={SECTION}
      >
        <Button asChild variant="outline">
          {open}
        </Button>
        {otherLanguages.length > 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            The same program in{" "}
            {otherLanguages.map((other, position) => (
              <span key={other}>
                {position > 0 &&
                  (position === otherLanguages.length - 1 ? " and " : ", ")}
                <Link
                  href={programPath(program, other)}
                  className="font-medium text-foreground hover:underline"
                >
                  {languageInfo(other).name}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
      </Section>

      <nav
        aria-label={`More ${info.name} programs`}
        className="grid gap-3 border-t py-8 sm:grid-cols-2 sm:py-10"
      >
        {previous ? (
          <Link
            href={programPath(previous, language)}
            className="group flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
          >
            <ArrowLeft
              className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            <span>
              <span className="block text-muted-foreground">Previous</span>
              <span className="font-medium">{previous.name}</span>
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next && (
          <Link
            href={programPath(next, language)}
            className="group flex items-center justify-end gap-2 rounded-lg border px-4 py-3 text-right text-sm transition-colors hover:bg-muted/50"
          >
            <span>
              <span className="block text-muted-foreground">Next</span>
              <span className="font-medium">{next.name}</span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
        <Link
          href={list.path}
          className="text-sm font-medium hover:underline sm:col-span-2"
        >
          All {info.name} programs for beginners
        </Link>
      </nav>
    </article>
  );
}
