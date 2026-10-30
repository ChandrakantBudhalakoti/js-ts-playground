import { ArrowRight, Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { playgroundHref } from "@/lib/examples";
import { findGuide, GUIDES, guideExample } from "@/lib/guides";
import { languageInfo } from "@/lib/languages";
import { pageMetadata } from "@/lib/metadata";
import { Breadcrumbs } from "./Breadcrumbs";
import { CodeBlock } from "./CodeBlock";
import { PageHeader } from "./PageHeader";
import { PlaygroundLink } from "./PlaygroundLink";
import { Section } from "./Section";

function requireGuide(slug: string) {
  const guide = findGuide(slug);
  if (!guide) notFound();
  return guide;
}

export function guideMetadata(slug: string): Metadata {
  const guide = requireGuide(slug);
  return pageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/examples/${guide.slug}`,
  });
}

/** An example guide page: explanation, code, expected output and next steps. */
export function GuideArticle({ slug }: { slug: string }) {
  const guide = requireGuide(slug);
  const example = guideExample(guide);
  const path = `/examples/${guide.slug}`;
  const related = GUIDES.filter((g) => g.slug !== guide.slug);

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Examples", path: "/examples" },
    { name: guide.heading, path },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6">
      <PageHeader
        above={<Breadcrumbs crumbs={breadcrumbs} />}
        heading={guide.heading}
        lead={guide.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        actions={
          <Button asChild size="lg" className="h-10 px-4">
            <PlaygroundLink href={playgroundHref(example.id)}>
              <Play className="fill-current" aria-hidden />
              Open in the playground
            </PlaygroundLink>
          </Button>
        }
      />

      <Section id="concepts" heading="Key concepts" className="py-10 sm:py-12">
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {guide.concepts.map((concept) => (
            <div key={concept.term}>
              <dt className="font-medium">{concept.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {concept.detail}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section
        id="code"
        heading="The code"
        intro={
          <p>
            {languageInfo(example.language).name} (
            {languageInfo(example.language).fileName}
            ). This is exactly what opens in the playground.
          </p>
        }
        className="py-10 sm:py-12"
      >
        <CodeBlock
          code={example.code}
          label={`${languageInfo(example.language).name} example code`}
        />
      </Section>

      <Section
        id="output"
        heading="Console output"
        intro="What the console prints when you run it."
        className="py-10 sm:py-12"
      >
        <CodeBlock code={guide.output.join("\n")} label="Console output" />
      </Section>

      <Section id="try-next" heading="Try next" className="py-10 sm:py-12">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          {guide.tryNext.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ol>
        <Button asChild variant="outline" className="mt-6">
          <PlaygroundLink href={playgroundHref(example.id)}>
            <Play className="fill-current" aria-hidden />
            Open in the playground
          </PlaygroundLink>
        </Button>
      </Section>

      <Section
        id="more"
        heading="More examples"
        className="border-t py-10 sm:py-12"
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {related.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/examples/${other.slug}`}
                className="group flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                {other.heading}
                <ArrowRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
