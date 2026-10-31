import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHeader } from "@/components/site/PageHeader";
import { programListPage } from "@/components/site/ProgramArticle";
import { ProgramList } from "@/components/site/ProgramList";
import { languageInfo } from "@/lib/languages";
import { pageMetadata } from "@/lib/metadata";
import {
  languageForSegment,
  languageSegment,
  runnableLanguages,
} from "@/lib/programs";

/** A language's beginner programs: /examples/python, /examples/c, ... */
export function generateStaticParams() {
  return runnableLanguages().map((language) => ({
    language: languageSegment(language),
  }));
}

function resolve(segment: string) {
  const language = languageForSegment(segment);
  if (!language) notFound();
  return language;
}

function description(name: string) {
  return `Classic ${name} programs for beginners: patterns, prime numbers, factorial, Fibonacci, arrays, strings and more. Each one explained, and runs in your browser.`;
}

export async function generateMetadata({
  params,
}: PageProps<"/examples/[language]">) {
  const language = resolve((await params).language);
  const page = programListPage(language);
  return pageMetadata({
    title: page.heading,
    description: description(languageInfo(language).name),
    path: page.path,
  });
}

export default async function ProgramListPage({
  params,
}: PageProps<"/examples/[language]">) {
  const language = resolve((await params).language);
  const page = programListPage(language);
  const { name } = languageInfo(language);
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <PageHeader
        above={
          <Breadcrumbs
            crumbs={[
              { name: "Home", path: "/" },
              { name: "Examples", path: "/examples" },
              { name: `${name} programs`, path: page.path },
            ]}
          />
        }
        heading={page.heading}
        lead={
          <p>
            The programs every {name} course starts with, from Hello World to
            sorting and recursion. Each page explains the idea in plain English,
            shows the code with a sample input and its output, and opens it in
            the playground so you can run and change it.
          </p>
        }
      />
      <div className="mt-8">
        <ProgramList language={language} headingLevel={2} />
      </div>
    </div>
  );
}
