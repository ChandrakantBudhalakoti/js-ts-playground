import { EXPECTED_TYPESCRIPT_VERSION } from "@/lib/compiler/options";
import { SITE_NAME } from "@/lib/site";

/**
 * Copy shared by the landing pages and their structured data. Every claim
 * here describes implemented behaviour; tests/unit/content.test.ts pins the
 * numbers that come from elsewhere in the code.
 */

/**
 * The code in the landing page's preview and what the playground's console
 * prints for it (asserted by tests/e2e/site.spec.ts).
 */
export const HERO_EXAMPLE = {
  language: "python" as const,
  code: `languages = ["Python", "C", "JavaScript"]

for language in languages:
    print(f"Ada is learning {language}")`,
  output: ["Python", "C", "JavaScript"]
    .map((language) => `Ada is learning ${language}`)
    .join("\n"),
};

export interface Faq {
  question: string;
  answer: string;
}

export const HOME_FAQS: Faq[] = [
  {
    question: `Is ${SITE_NAME} free?`,
    answer:
      "Yes. It is free to use, needs no account, and the source code is open under the MIT license.",
  },
  {
    question: "Does it work on a phone or tablet?",
    answer:
      "Yes, it is designed for them. The editor, the output and the input each get the full screen, buttons are big enough to tap, and a row of code keys gives you brackets, symbols, Tab and the arrow keys. A recent version of Chrome, Edge or Firefox is all you need, and you can add it to your home screen like an app.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Everything runs in a modern browser. The Monaco editor and the TypeScript compiler are loaded from the site itself the first time you open the playground, and each other language is downloaded the first time you pick it.",
  },
  {
    question: "Which languages can I run?",
    answer:
      "JavaScript and TypeScript, plus Python, C, C++, Go, Ruby, PHP, Lua and R. Those run on WebAssembly builds of their usual implementations: CPython, Clang, the Yaegi Go interpreter, CRuby, PHP, Lua and webR. Programs that read standard input get the text of the Input tab.",
  },
  {
    question: "Is my code sent to a server?",
    answer:
      "No. Type checking, compiling and running all happen in your browser, in every language. Drafts are saved in your browser's local storage, and share links keep the code in the part of the URL after the #, which browsers do not send to the server.",
  },
  {
    question: "Can I import npm packages?",
    answer:
      "No. The sandbox has no package loader and no network access, so imports of packages do not resolve. Built-in language features and Web Worker APIs such as timers, crypto and structuredClone are available. The other languages likewise come with their standard libraries only, without pip, Go modules or gems.",
  },
  {
    question: "Can I use document, window or fetch?",
    answer:
      "No. Your code runs in a Web Worker inside a sandboxed iframe, so there is no DOM, and network requests are blocked. The editor's types match this environment.",
  },
  {
    question: "Which TypeScript version does it use?",
    answer: `TypeScript ${EXPECTED_TYPESCRIPT_VERSION} in strict mode, with the ES2024 and Web Worker type libraries.`,
  },
  {
    question: "Can I run TypeScript that has type errors?",
    answer:
      'Yes, by default, the same way tsc still emits JavaScript: the run starts with a warning in the console. Turn on "Block Run on type errors" in Settings to stop that. Syntax errors always block a run.',
  },
  {
    question: "What happens if my code has an infinite loop?",
    answer:
      "The run is stopped when it reaches the time limit (5 seconds by default, adjustable from 2 to 30 seconds in Settings), or as soon as you press Stop. Either way the sandbox is destroyed, so the page stays responsive.",
  },
];

/** FAQPage structured data for FAQs that are visible on the same page. */
export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
