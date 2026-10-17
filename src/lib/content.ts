import { EXPECTED_TYPESCRIPT_VERSION } from "@/lib/compiler/options";

/**
 * Copy shared by the landing pages and their structured data. Every claim
 * here describes implemented behaviour; tests/unit/content.test.ts pins the
 * numbers that come from elsewhere in the code.
 */

/**
 * The code in the landing page's preview and the line the playground's console
 * prints for it (asserted by tests/e2e/site.spec.ts).
 */
export const HERO_EXAMPLE = {
  code: `interface User {
  name: string;
  languages: string[];
}

const ada: User = {
  name: "Ada",
  languages: ["TS", "JS"],
};
console.log(\`Hi, \${ada.name}!\`, ada.languages);`,
  output: "Hi, Ada! [ 'TS', 'JS' ]",
};

export interface Faq {
  question: string;
  answer: string;
}

export const HOME_FAQS: Faq[] = [
  {
    question: "Is JS/TS Playground free?",
    answer:
      "Yes. It is free to use, needs no account, and the source code is open under the MIT license.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Everything runs in a modern browser. The Monaco editor and the TypeScript compiler are loaded from the site itself the first time you open the playground.",
  },
  {
    question: "Is my code sent to a server?",
    answer:
      "No. Type checking, compiling and running all happen in your browser. Drafts are saved in your browser's local storage, and share links keep the code in the part of the URL after the #, which browsers do not send to the server.",
  },
  {
    question: "Can I import npm packages?",
    answer:
      "No. The sandbox has no package loader and no network access, so imports of packages do not resolve. Built-in language features and Web Worker APIs such as timers, crypto and structuredClone are available.",
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
