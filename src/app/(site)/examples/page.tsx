import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  type BrowserItem,
  ExampleBrowser,
} from "@/components/site/ExampleBrowser";
import { PageHeader } from "@/components/site/PageHeader";
import { programListPage } from "@/components/site/ProgramArticle";
import { Section } from "@/components/site/Section";
import { EXAMPLES, exampleLevel, playgroundHref } from "@/lib/examples";
import { GUIDES, guideExample } from "@/lib/guides";
import { LANGUAGES, languageInfo } from "@/lib/languages";
import { pageMetadata } from "@/lib/metadata";
import {
  LEVELS,
  programExampleId,
  programPath,
  PROGRAMS,
  runnableLanguages,
} from "@/lib/programs";
import type { CodeExample } from "@/types/playground";

export const metadata = pageMetadata({
  title: "Code Examples to Run Online",
  description:
    "Runnable examples in Python, C, C++, Java, JavaScript, TypeScript, Go, Ruby, PHP, Lua and R: beginner programs, guides and more. Filter by language and level.",
  path: "/examples",
});

function browserItem(example: CodeExample): BrowserItem {
  const program = PROGRAMS.find(
    (candidate) => programExampleId(candidate, example.language) === example.id,
  );
  const guide = GUIDES.find((candidate) => candidate.exampleId === example.id);
  return {
    id: example.id,
    title: example.title,
    description: example.description,
    language: example.language,
    level: exampleLevel(example),
    page: program
      ? programPath(program, example.language)
      : guide && `/examples/${guide.slug}`,
    playground: playgroundHref(example.id),
  };
}

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <PageHeader
        heading="Code Examples to Run Online"
        lead={
          <p>
            Short, runnable programs that each focus on one idea. Read how it
            works, then open it in the playground to run it and make it your
            own.
          </p>
        }
      />

      <Section id="guides" heading="Guided examples">
        <ul className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/examples/${guide.slug}`}
                className="group flex h-full flex-col rounded-xl border p-5 transition-colors hover:bg-muted/50"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {languageInfo(guideExample(guide).language).name}
                </span>
                <h3 className="mt-1 flex items-center gap-2 font-medium">
                  {guide.heading}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {guide.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="programs"
        heading="Programs for beginners"
        intro="The classic programs from first-year courses and lab files, from Hello World to sorting and recursion, each explained in plain English."
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {runnableLanguages().map((language) => (
            <li key={language}>
              <Link
                href={programListPage(language).path}
                className="group flex items-center justify-between gap-2 rounded-xl border px-4 py-3 font-medium transition-colors hover:bg-muted/50"
              >
                {languageInfo(language).name} programs
                <ArrowRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="all"
        heading="All examples"
        intro="Filter by language and level. Each one opens in the playground, and is also in the editor's Examples menu."
      >
        <ExampleBrowser
          items={EXAMPLES.map((example) => browserItem(example))}
          languages={LANGUAGES.filter((info) =>
            EXAMPLES.some((example) => example.language === info.id),
          ).map((info) => ({ id: info.id, name: info.name }))}
          levels={[...LEVELS]}
        />
      </Section>
    </div>
  );
}
