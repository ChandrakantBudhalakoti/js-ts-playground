import { BookOpen, Play } from "lucide-react";
import { ExampleList } from "@/components/site/ExampleList";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { PlaygroundLink } from "@/components/site/PlaygroundLink";
import { FaqList, Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { faqJsonLd, type Faq } from "@/lib/content";
import { playgroundHref } from "@/lib/examples";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Online JavaScript Playground",
  description:
    "Run JavaScript online in an isolated browser sandbox: modern syntax, top-level await, syntax checking and a console that inspects objects, Maps and Sets. Free.",
  path: "/javascript",
});

const CAPABILITIES = [
  {
    title: "Modern JavaScript, run as written",
    text: "Your code is not transpiled, so every feature your browser supports works: classes with private fields, optional chaining, Object.groupBy, toSorted, findLast and most of ES2024 in current browsers.",
  },
  {
    title: "Top-level await",
    text: "Code runs as an ES module, so you can await at the top level. A run finishes once your code and every timer it started are done.",
  },
  {
    title: "A console for inspecting values",
    text: "log, info, warn, error and debug, plus group, count, time and timeEnd, assert and dir. Values print like Node's util.inspect, including nested objects, Maps, Sets, class instances and circular references.",
  },
  {
    title: "Syntax checking and clear errors",
    text: "Syntax errors are underlined as you type and listed in the Problems panel; they block a run until fixed. Uncaught runtime errors show their message and line, and clicking one jumps to it.",
  },
];

const AVAILABLE = [
  "console, setTimeout, setInterval and queueMicrotask",
  "Promises, async functions and async iteration",
  "crypto, structuredClone, TextEncoder and TextDecoder",
  "URL, Intl, Math, JSON, Map, Set and typed arrays",
];

const UNAVAILABLE = [
  "document, window and other DOM APIs (code runs in a Web Worker)",
  "fetch and other network requests (blocked by the sandbox)",
  "require, npm packages and Node.js APIs such as fs and process",
];

const FAQS: Faq[] = [
  {
    question: "Which JavaScript features can I use?",
    answer:
      "JavaScript runs unchanged in your browser's own engine, so the answer is whatever your browser supports. Current versions of Chrome, Edge, Firefox and Safari support nearly all of ES2024, including Object.groupBy and Promise.withResolvers.",
  },
  {
    question: "Why is document (or window) undefined?",
    answer:
      "Your code runs in a Web Worker, which has no page to draw on. That keeps the playground responsive and lets a stuck run be stopped instantly. Worker globals such as self, console and timers are available.",
  },
  {
    question: "How do I see how long my code takes?",
    answer:
      "Wrap it in console.time('label') and console.timeEnd('label'). On wider screens the toolbar also shows how long each completed run took.",
  },
  {
    question: "Can I switch to TypeScript later?",
    answer:
      "Yes. Pick TypeScript in the language menu in the toolbar. Your code is kept and checked as TypeScript from then on.",
  },
];

export default function JavaScriptPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <JsonLd data={faqJsonLd(FAQS)} />
      <PageHeader
        heading="Online JavaScript Playground"
        lead={
          <p>
            Write and run modern JavaScript in your browser. The playground
            checks your syntax as you type, runs your code in an isolated
            sandbox and shows everything it logs in a console built for
            inspecting values.
          </p>
        }
        actions={
          <>
            <Button asChild size="lg" className="h-10 px-4">
              <PlaygroundLink href={playgroundHref("js-basics")}>
                <Play className="fill-current" aria-hidden />
                Open the JavaScript playground
              </PlaygroundLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-10 px-4">
              <a href="#examples">
                <BookOpen aria-hidden />
                JavaScript examples
              </a>
            </Button>
          </>
        }
      />

      <Section id="features" heading="What you can do">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {CAPABILITIES.map((item) => (
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
        intro="Code runs in a dedicated Web Worker inside a sandboxed iframe with its own opaque origin. It can't read the playground's page, cookies or storage."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border p-5">
            <h3 className="font-medium">Available</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {AVAILABLE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border p-5">
            <h3 className="font-medium">Not available</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {UNAVAILABLE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        id="examples"
        heading="JavaScript examples"
        intro="Each one opens in the playground, ready to run."
      >
        <ExampleList language="javascript" />
      </Section>

      <Section id="faq" heading="JavaScript playground FAQ">
        <FaqList faqs={FAQS} />
      </Section>
    </div>
  );
}
