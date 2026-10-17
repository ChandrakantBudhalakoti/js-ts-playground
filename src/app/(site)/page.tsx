import {
  ArrowRight,
  BookOpen,
  Code2,
  FileCheck2,
  ListChecks,
  Play,
  Share2,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { CodePreview } from "@/components/site/CodePreview";
import { JsonLd } from "@/components/site/JsonLd";
import { LegacyShareRedirect } from "@/components/site/LegacyShareRedirect";
import { PlaygroundLink } from "@/components/site/PlaygroundLink";
import { FaqList, Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { faqJsonLd, HOME_FAQS } from "@/lib/content";
import { GUIDES } from "@/lib/guides";
import { pageMetadata } from "@/lib/metadata";
import {
  absoluteUrl,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/site";

export const metadata = pageMetadata({
  title: SITE_TITLE,
  absoluteTitle: true,
  description: SITE_DESCRIPTION,
  path: "/",
});

const FEATURES = [
  {
    icon: Code2,
    title: "VS Code-style editor",
    text: "Monaco, the editor behind VS Code, with syntax highlighting, autocomplete, hover information, parameter hints and Prettier formatting.",
  },
  {
    icon: FileCheck2,
    title: "Real TypeScript type checking",
    text: 'A TypeScript language service checks your code as you type, so const age: number = "25" is flagged before you run it.',
  },
  {
    icon: ListChecks,
    title: "Problems panel",
    text: "Every error and warning with its code and position, matching the squiggles in the editor. Click one to jump to the line.",
  },
  {
    icon: ShieldCheck,
    title: "Isolated sandbox",
    text: "Code runs in a Web Worker inside a sandboxed iframe with no network access. Stop, or the time limit, ends even an infinite loop.",
  },
  {
    icon: Terminal,
    title: "Interactive console",
    text: "log, info, warn and error, plus groups, counters and timers. Objects, Maps, Sets and circular references print safely as text.",
  },
  {
    icon: Share2,
    title: "Share links and drafts",
    text: "Share code with a link that carries it in the URL, with nothing stored on a server. Your draft is saved in your browser between visits.",
  },
];

const STEPS = [
  {
    title: "Write",
    text: "Pick JavaScript or TypeScript, start from an example, or paste your own code.",
  },
  {
    title: "Check",
    text: "Syntax and type errors show up as squiggles and in the Problems panel while you type.",
  },
  {
    title: "Run",
    text: "Press Run or Ctrl/⌘ + Enter. TypeScript is compiled in your browser and the output streams into the console, with runtime errors mapped back to your lines.",
  },
];

const LIMITATIONS = [
  "It is not Node.js: there is no fs, process or require.",
  "npm packages can't be imported.",
  "Code runs in a Web Worker, so there is no document or window.",
  "Network requests such as fetch are blocked.",
  "Each run has a time limit, 5 seconds by default and up to 30 seconds.",
];

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  description: SITE_DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript and a modern web browser.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  license: "https://opensource.org/licenses/MIT",
  sameAs: [REPO_URL],
};

export default function HomePage() {
  return (
    <>
      <LegacyShareRedirect />
      <JsonLd data={webApplicationJsonLd} />
      <JsonLd data={faqJsonLd(HOME_FAQS)} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="grid items-center gap-10 pt-12 pb-8 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Free · Open source · No sign-up
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Write and Run JavaScript &amp; TypeScript Online
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
              A free online coding playground for JavaScript and TypeScript.
              Write code in a VS Code-style editor, catch type errors, execute
              snippets in an isolated browser sandbox, and share your code with
              a link.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-10 px-4">
                <PlaygroundLink>
                  <Play className="fill-current" aria-hidden />
                  Start Coding
                </PlaygroundLink>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-10 px-4">
                <Link href="/examples">
                  <BookOpen aria-hidden />
                  Explore Examples
                </Link>
              </Button>
            </div>
          </div>
          <CodePreview />
        </section>

        <Section
          id="features"
          heading="Everything you need to try out an idea"
          intro="No project setup, no build step and no account. Open the playground and start typing."
        >
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border p-5">
                <Icon
                  className="size-5 text-emerald-700 dark:text-emerald-400"
                  aria-hidden
                />
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="how-it-works" heading="How it works">
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="languages" heading="JavaScript or TypeScript">
          <div className="grid gap-6 md:grid-cols-2">
            <Link
              href="/javascript"
              className="group rounded-xl border p-6 transition-colors hover:bg-muted/50"
            >
              <h3 className="flex items-center gap-2 font-medium">
                JavaScript playground
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Modern JavaScript with top-level await, syntax checking and a
                full console. See what the runtime supports.
              </p>
            </Link>
            <Link
              href="/typescript"
              className="group rounded-xl border p-6 transition-colors hover:bg-muted/50"
            >
              <h3 className="flex items-center gap-2 font-medium">
                TypeScript playground
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Strict type checking as you type, transpiling in the browser and
                runtime errors mapped to your TypeScript lines.
              </p>
            </Link>
          </div>
        </Section>

        <Section
          id="examples"
          heading="Learn by running examples"
          intro="Each example explains a concept and opens in the playground, ready to run and change."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={`/examples/${guide.slug}`}
                  className="block h-full rounded-xl border p-5 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium">{guide.heading}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {guide.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link
              href="/examples"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Browse all examples
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </p>
        </Section>

        <Section
          id="limitations"
          heading="Good to know"
          intro="The playground is a browser sandbox for experimenting, not a full development environment."
        >
          <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {LIMITATIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section id="faq" heading="Frequently asked questions">
          <FaqList faqs={HOME_FAQS} />
        </Section>

        <section className="my-12 rounded-2xl border bg-muted/40 px-6 py-10 text-center sm:my-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to write some code?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            On your first visit the playground opens with a working TypeScript
            example. Press Run to see it in action.
          </p>
          <Button asChild size="lg" className="mt-6 h-10 px-4">
            <PlaygroundLink>
              <Play className="fill-current" aria-hidden />
              Start Coding
            </PlaygroundLink>
          </Button>
        </section>
      </div>
    </>
  );
}
