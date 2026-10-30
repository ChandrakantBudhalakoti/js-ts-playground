import {
  ArrowRight,
  BookOpen,
  FileCheck2,
  Keyboard,
  Languages,
  Play,
  Share2,
  ShieldCheck,
  Smartphone,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { CodePreview } from "@/components/site/CodePreview";
import { JsonLd } from "@/components/site/JsonLd";
import { LegacyShareRedirect } from "@/components/site/LegacyShareRedirect";
import { PlaygroundLink } from "@/components/site/PlaygroundLink";
import { programListPage } from "@/components/site/ProgramArticle";
import { FaqList, Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { faqJsonLd, HOME_FAQS } from "@/lib/content";
import { GUIDES } from "@/lib/guides";
import { LANGUAGES, languageInfo } from "@/lib/languages";
import { pageMetadata } from "@/lib/metadata";
import { runnableLanguages } from "@/lib/programs";
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
    icon: Smartphone,
    title: "Made for phones and tablets",
    text: "Large buttons, a full-screen editor and tabs for your code, its output and its input. Install it on your home screen like an app.",
  },
  {
    icon: Keyboard,
    title: "Code keys for touch screens",
    text: "Brackets, quotes, semicolons, Tab and arrow keys in one row above the keyboard, so you don't hunt through phone keyboard layouts.",
  },
  {
    icon: Languages,
    title: "Ten languages",
    text: "Python, C, C++, Java, JavaScript, TypeScript, Go, Ruby, PHP, Lua and R, each on a real compiler or interpreter: CPython, Clang, javac, CRuby, PHP, webR and more.",
  },
  {
    icon: FileCheck2,
    title: "Errors you can fix",
    text: "TypeScript, C and C++ are checked as you type. Every error names the line it happened on; tap it to jump there.",
  },
  {
    icon: Terminal,
    title: "Output and input",
    text: "See what your program prints the moment it prints it. Programs that read input (input(), scanf, cin) read the Input tab.",
  },
  {
    icon: ShieldCheck,
    title: "Private and free",
    text: "Your code runs in your browser, not on a server, and is never uploaded. No account, no ads, no limits on how much you practise.",
  },
  {
    icon: Share2,
    title: "Share with a link",
    text: "Send your code to a friend or teacher with a link, through any app on your phone. Your work is saved in your browser between visits.",
  },
];

const STEPS = [
  {
    title: "Pick a language",
    text: "Python, C, C++, Java, JavaScript or any of the others. Each opens with a working example to learn from.",
  },
  {
    title: "Write your code",
    text: "Type in a real code editor with syntax highlighting. On a phone, use the code keys for brackets and symbols.",
  },
  {
    title: "Run it",
    text: "Press Run. The program runs right on your device, and its output appears in the console, with any error linked to its line.",
  },
];

const LIMITATIONS = [
  "There are no package managers: each language comes with its standard library, but npm, pip, Go modules and gems can't be installed.",
  "Programs can't open files or use the network.",
  "C++ exceptions are not supported: a throw ends the program with its message.",
  "The first run of Python, C, C++, Java, Go, Ruby, PHP, Lua or R downloads its runtime once (0.2 to 27 MB): the size is shown first, and you choose. After that it works offline.",
  "Java reads input with Scanner; printf with %f (decimal places) and BufferedReader are not available in the browser yet.",
  "Each run has a time limit, 5 seconds by default and up to 30 seconds.",
];

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  description: SITE_DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "Online compiler and code editor",
  operatingSystem: "Any (Android, iOS, iPadOS, Windows, macOS, Linux)",
  browserRequirements: "Requires JavaScript and a modern web browser.",
  featureList: LANGUAGES.map((info) => `${info.name}: ${info.engine}`),
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
        <section className="grid items-center gap-10 pt-10 pb-8 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Free · No sign-up · Made for phones and tablets
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Learn to Code on Your Phone, Tablet or Laptop
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
              {SITE_NAME} is a free online compiler and code editor for Python,
              C, C++, Java, JavaScript, TypeScript, Go, Ruby, PHP, Lua and R.
              Write a program, press Run and see what it does. Everything runs
              in your browser, so all you need is the device you already have.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-5">
                <PlaygroundLink>
                  <Play className="fill-current" aria-hidden />
                  Start Coding
                </PlaygroundLink>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-5">
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
          heading="A coding lab in your pocket"
          intro="No computer, installation or account needed. Open it and start typing, wherever you are."
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

        <Section
          id="languages"
          heading="Pick a language"
          intro="Each one runs on its real compiler or interpreter, built for WebAssembly, entirely in your browser."
        >
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {LANGUAGES.map((info) => (
              <li key={info.id}>
                <Link
                  href={info.path}
                  className="group flex h-full flex-col rounded-xl border p-4 transition-colors hover:bg-muted/50"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {info.name}
                    <ArrowRight
                      className="size-3.5 opacity-60 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {info.version}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <Link
              href="/languages"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Compare the languages
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </p>
        </Section>

        <Section
          id="examples"
          heading="Learn by running examples"
          intro="Each example explains a concept and opens in the playground, ready to run and change."
        >
          <h3 className="font-medium">Programs for beginners</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The classic first-year and lab-file programs, from Hello World and
            star patterns to prime numbers, sorting and recursion, each
            explained in plain English.
          </p>
          <ul className="mt-4 mb-10 flex flex-wrap gap-3">
            {runnableLanguages().map((language) => (
              <li key={language}>
                <Link
                  href={programListPage(language).path}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  {languageInfo(language).name} programs
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mb-4 font-medium">Guided examples</h3>
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
          intro={`${SITE_NAME} is a place to learn and experiment, not a full development environment.`}
        >
          <ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {LIMITATIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section id="about" heading={`Why “${SITE_NAME}”?`}>
          <div className="max-w-2xl space-y-4 leading-relaxed text-muted-foreground">
            <p>
              A takhti (<span lang="hi">तख़्ती</span>) is the wooden slate
              generations of Indian children practised writing on: write a
              letter, wipe the board clean, and try again until it comes out
              right. {SITE_NAME} is that slate for code.
            </p>
            <p className="font-medium text-foreground">
              Learn to code on the device you already have, the way generations
              learned to write on a takhti.
            </p>
          </div>
        </Section>

        <Section id="faq" heading="Frequently asked questions">
          <FaqList faqs={HOME_FAQS} />
        </Section>

        <section className="my-12 rounded-2xl border bg-muted/40 px-6 py-10 text-center sm:my-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to write your first program?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            The playground opens with a working example. Press Run to see it in
            action, then change it and run it again.
          </p>
          <Button asChild size="lg" className="mt-6 h-11 px-5">
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
