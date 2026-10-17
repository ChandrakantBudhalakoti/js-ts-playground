import { CircleAlert, Play } from "lucide-react";
import { ExampleList } from "@/components/site/ExampleList";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { PlaygroundLink } from "@/components/site/PlaygroundLink";
import { FaqList, Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import {
  EXPECTED_TYPESCRIPT_VERSION,
  SHARED_COMPILER_OPTIONS,
} from "@/lib/compiler/options";
import { faqJsonLd, type Faq } from "@/lib/content";
import { playgroundHref } from "@/lib/examples";
import { pageMetadata } from "@/lib/metadata";

const MAJOR_MINOR = EXPECTED_TYPESCRIPT_VERSION.split(".")
  .slice(0, 2)
  .join(".");

export const metadata = pageMetadata({
  title: "Online TypeScript Playground",
  description: `Write and run TypeScript online with real type checking (TypeScript ${MAJOR_MINOR}, strict mode), autocomplete, a Problems panel and runtime errors mapped to your lines.`,
  path: "/typescript",
});

const CHECKING = [
  {
    title: "The real TypeScript compiler",
    text: `TypeScript ${EXPECTED_TYPESCRIPT_VERSION} runs in a Web Worker as an in-memory language service, so you get the same syntactic and semantic errors as tsc, not an approximation.`,
  },
  {
    title: "Errors as you type",
    text: "Problems are underlined in the editor and listed in the Problems panel with their TS error code and position. Click one to jump to it.",
  },
  {
    title: "Editor intelligence",
    text: "Autocomplete, hover types and parameter hints come from Monaco's TypeScript service, configured with the same compiler options as the checker, so the two always agree.",
  },
  {
    title: "Runtime errors on your lines",
    text: "TypeScript is transpiled in the browser with a source map. When the code throws, the console shows the line and column in your TypeScript, not in the generated JavaScript.",
  },
];

const libs = SHARED_COMPILER_OPTIONS.lib
  .map((file) => file.replace(/^lib\.|\.d\.ts$/g, ""))
  .filter((name) => !name.includes("."))
  .map((name) => (name === "webworker" ? "WebWorker" : name.toUpperCase()));

const SETTINGS: [string, string][] = [
  ["TypeScript version", EXPECTED_TYPESCRIPT_VERSION],
  ["strict", String(SHARED_COMPILER_OPTIONS.strict)],
  ["target", "ES2022"],
  ["module", "ESNext (every file is a module, so top-level await works)"],
  ["lib", libs.join(", ")],
];

const FAQS: Faq[] = [
  {
    question: "Why does my code run when it has type errors?",
    answer:
      'Types are checked, then erased, the same way tsc still emits JavaScript when there are type errors. The run starts with a warning listing how many there are. Turn on "Block Run on type errors" in Settings if you prefer to fix them first. Syntax errors always block a run.',
  },
  {
    question: "Can I change the compiler options?",
    answer:
      "Not at the moment. The playground uses the single configuration listed above for both the type checker and the editor's autocomplete.",
  },
  {
    question: "Can I import types from npm, such as @types/node?",
    answer:
      "No. Only TypeScript's built-in ES2024 and Web Worker libraries are loaded, so imports of packages are reported as unresolved modules.",
  },
  {
    question: "Can I convert my TypeScript to JavaScript?",
    answer:
      "Switch the toggle in the toolbar to JS to keep editing the same code as JavaScript. Type annotations are not removed for you, so the JavaScript checker will report them as syntax errors until you delete them.",
  },
];

export default function TypeScriptPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <JsonLd data={faqJsonLd(FAQS)} />
      <PageHeader
        heading="Online TypeScript Playground"
        lead={
          <p>
            Write TypeScript with the same type checking you get from tsc, see
            every error as you type, and run the result straight away. Compiling
            happens in your browser: nothing to install, nothing uploaded.
          </p>
        }
        actions={
          <>
            <Button asChild size="lg" className="h-10 px-4">
              <PlaygroundLink href={playgroundHref("ts-hello")}>
                <Play className="fill-current" aria-hidden />
                Open the TypeScript playground
              </PlaygroundLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-10 px-4">
              <PlaygroundLink href={playgroundHref("ts-type-errors")}>
                <CircleAlert aria-hidden />
                See the type checker in action
              </PlaygroundLink>
            </Button>
          </>
        }
      />

      <Section id="features" heading="Type checking you can trust">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {CHECKING.map((item) => (
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
        id="compiler-settings"
        heading="Compiler settings"
        intro="One fixed configuration, shared by the type checker and the editor."
      >
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">TypeScript compiler settings</caption>
            <thead className="bg-muted/40">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Setting
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SETTINGS.map(([name, value]) => (
                <tr key={name}>
                  <th scope="row" className="px-4 py-2.5 font-mono font-normal">
                    {name}
                  </th>
                  <td className="px-4 py-2.5 text-muted-foreground">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="examples"
        heading="TypeScript examples"
        intro="Each one opens in the playground, ready to run."
      >
        <ExampleList language="typescript" />
      </Section>

      <Section id="faq" heading="TypeScript playground FAQ">
        <FaqList faqs={FAQS} />
      </Section>
    </div>
  );
}
