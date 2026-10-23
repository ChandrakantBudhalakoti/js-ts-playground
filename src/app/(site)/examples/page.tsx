import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ExampleList } from "@/components/site/ExampleList";
import { PageHeader } from "@/components/site/PageHeader";
import { Section } from "@/components/site/Section";
import { GUIDES, guideExample } from "@/lib/guides";
import { LANGUAGES, languageInfo } from "@/lib/languages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Code Examples to Run Online",
  description:
    "Runnable examples in Python, C, C++, JavaScript, TypeScript, Go, Ruby, PHP, Lua and R, plus guides that explain them. Open one, run it, then change it.",
  path: "/examples",
});

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

      {LANGUAGES.map((info, index) => (
        <Section
          key={info.id}
          id={info.id}
          heading={`${info.name} examples`}
          intro={
            index === 0
              ? "Also available from the Examples menu in the editor."
              : undefined
          }
        >
          <ExampleList language={info.id} />
        </Section>
      ))}
    </div>
  );
}
