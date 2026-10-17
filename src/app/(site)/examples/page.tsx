import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ExampleList } from "@/components/site/ExampleList";
import { PageHeader } from "@/components/site/PageHeader";
import { Section } from "@/components/site/Section";
import { GUIDES, guideExample } from "@/lib/guides";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "JavaScript & TypeScript Examples",
  description:
    "Runnable JavaScript and TypeScript examples: async/await, promises, array methods, interfaces and generics. Read the explanation, then edit and run the code.",
  path: "/examples",
});

const LANGUAGE_LABEL = { javascript: "JavaScript", typescript: "TypeScript" };

export default function ExamplesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <PageHeader
        heading="JavaScript & TypeScript Examples"
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
                  {LANGUAGE_LABEL[guideExample(guide).language]}
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
        id="typescript"
        heading="TypeScript examples in the playground"
        intro="Also available from the Examples menu in the editor."
      >
        <ExampleList language="typescript" />
      </Section>

      <Section id="javascript" heading="JavaScript examples in the playground">
        <ExampleList language="javascript" />
      </Section>
    </div>
  );
}
