import { BookOpen, Play } from "lucide-react";
import { ExampleList } from "@/components/site/ExampleList";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { PlaygroundLink } from "@/components/site/PlaygroundLink";
import { FaqList, Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { faqJsonLd } from "@/lib/content";
import { DEFAULT_EXAMPLE, playgroundHref } from "@/lib/examples";
import { languagePage, type LanguagePage } from "@/lib/language-pages";
import { languageInfo } from "@/lib/languages";
import { pageMetadata } from "@/lib/metadata";

export function languagePageMetadata(language: LanguagePage["language"]) {
  const page = languagePage(language);
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: languageInfo(language).path,
  });
}

/** The page of one language that runs on WebAssembly (/python, /c, …). */
export function LanguageLanding({
  language,
}: {
  language: LanguagePage["language"];
}) {
  const page = languagePage(language);
  const info = languageInfo(language);
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <JsonLd data={faqJsonLd(page.faqs)} />
      <PageHeader
        heading={page.title}
        lead={<p>{page.lead}</p>}
        actions={
          <>
            <Button asChild size="lg" className="h-10 px-4">
              <PlaygroundLink
                href={playgroundHref(DEFAULT_EXAMPLE[language].id)}
              >
                <Play className="fill-current" aria-hidden />
                Open the {info.name} playground
              </PlaygroundLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-10 px-4">
              <a href="#examples">
                <BookOpen aria-hidden />
                {info.name} examples
              </a>
            </Button>
          </>
        }
      />

      <Section id="features" heading="What you can do">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {page.capabilities.map((item) => (
            <div key={item.title}>
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="runtime"
        heading="The runtime environment"
        intro={`${info.engine}. It runs in a sandboxed Web Worker in your browser, with no network access: your code never leaves your device.`}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border p-5">
            <h3 className="font-medium">Available</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {page.available.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-5">
            <h3 className="font-medium">Not available</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {page.unavailable.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        id="examples"
        heading={`${info.name} examples`}
        intro="Each one opens in the playground, ready to run."
      >
        <ExampleList language={language} />
      </Section>

      <Section id="faq" heading={`${info.name} FAQ`}>
        <FaqList faqs={page.faqs} />
      </Section>
    </div>
  );
}
