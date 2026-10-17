import { findExample } from "@/lib/examples";
import type { CodeExample } from "@/types/playground";

/**
 * Example guide pages (`/examples/<slug>`). Each one explains a runnable
 * example from `EXAMPLES`; the code shown on the page is that example's code,
 * and "Open in the playground" loads it by id.
 */
export interface Guide {
  slug: string;
  exampleId: string;
  /** Page heading (H1). */
  heading: string;
  /** `<title>`, before the site-name suffix. */
  title: string;
  /** Meta description. */
  description: string;
  /** Lead paragraph(s) under the heading. */
  intro: string[];
  concepts: { term: string; detail: string }[];
  /**
   * The console output of a run, in order (system lines such as "Completed"
   * excluded). Asserted by tests/e2e/guides.spec.ts against a real run.
   */
  output: string[];
  /** Small changes the reader can try. */
  tryNext: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "async-await",
    exampleId: "js-async-await",
    heading: "JavaScript Async/Await Example",
    title: "JavaScript Async/Await Example",
    description:
      "A runnable JavaScript async/await example: sequential vs. parallel awaits, Promise.all and error handling with try/catch. Edit and run it in your browser.",
    intro: [
      "async and await let you write asynchronous code that reads from top to bottom. An async function always returns a promise, and await pauses that function until a promise settles, without blocking anything else.",
      "This example simulates slow requests with a timer, so you can see the difference between awaiting one request at a time and starting them all at once.",
    ],
    concepts: [
      {
        term: "async function",
        detail:
          "Always returns a promise. A returned value resolves it; a thrown error rejects it.",
      },
      {
        term: "await",
        detail:
          "Waits for a promise and unwraps its value. The playground runs code as an ES module, so await also works at the top level.",
      },
      {
        term: "Sequential vs. parallel",
        detail:
          "Awaiting inside a loop runs requests one after another. Promise.all starts them together and waits for all of them.",
      },
      {
        term: "Error handling",
        detail:
          "A rejected promise throws at the await, so try/catch/finally works the same way as with synchronous code.",
      },
    ],
    output: [
      "Loaded User 1",
      "Loaded User 2",
      "Loaded User 3",
      "Loaded in parallel: [ 'User 1', 'User 2', 'User 3' ]",
      "Parallel was faster: true",
      "Caught: No user with id 0",
      "finally runs either way",
      "Is a promise: true",
      "Resolved to: User 4",
    ],
    tryNext: [
      "Replace Promise.all with Promise.allSettled and pass an invalid id, to keep the successful results when one request fails.",
      "Remove the await in the for loop and log the result, to see the pending promises.",
      "Wrap the sequential loop in console.time and console.timeEnd to measure it.",
    ],
  },
  {
    slug: "array-methods",
    exampleId: "js-array-methods",
    heading: "JavaScript Array Methods Example",
    title: "JavaScript Array Methods Example",
    description:
      "Learn JavaScript array methods with a runnable example: map, filter, reduce, find, some, every, toSorted and Object.groupBy. Edit and run it online.",
    intro: [
      "Most everyday data work in JavaScript is done with a handful of array methods. This example applies them to a small list of orders: transforming, searching, sorting without mutating, and grouping.",
      "Each method takes a callback, so the same patterns work for any shape of data.",
    ],
    concepts: [
      {
        term: "map, filter, reduce",
        detail:
          "filter keeps the items that match, map transforms each item, and reduce combines them into a single value.",
      },
      {
        term: "find, findLast, some, every",
        detail:
          "find and findLast return the first or last matching item; some and every answer yes-or-no questions about the whole array.",
      },
      {
        term: "toSorted and toReversed",
        detail:
          "Unlike sort and reverse, these ES2023 methods return a new array and leave the original unchanged.",
      },
      {
        term: "Object.groupBy",
        detail:
          "Groups items into an object keyed by the value the callback returns (ES2024).",
      },
    ],
    output: [
      "Paid totals: [ 42.5, 15.25 ]",
      "Revenue: 57.75",
      "First order over 100: 2",
      "Ada's last order: 4",
      "Any pending? true",
      "All positive? true",
      "Ids by total: [ 2, 4, 1, 3 ]",
      "Original order: [ 1, 2, 3, 4 ]",
      "Reversed copy: [ 4, 3, 2, 1 ]",
      "Customers: [ 'Ada', 'Grace', 'Linus' ]",
      "Paid order ids: [ 1, 3 ]",
      "Last order: 4",
      "Evens: [ 0, 2, 4, 6, 8 ]",
    ],
    tryNext: [
      "Replace toSorted with sort and log orders again, to see the original array change.",
      "Use reduce to total the revenue per customer.",
      "Group the orders by customer instead of status.",
    ],
  },
  {
    slug: "promises",
    exampleId: "js-promises",
    heading: "JavaScript Promises Example",
    title: "JavaScript Promises Example",
    description:
      "A runnable JavaScript Promises example: then chaining, Promise.all, race, any, allSettled, withResolvers, and the order of microtasks and timers.",
    intro: [
      "A promise represents a value that will be available later, or an error explaining why it never will be. Promises are what async/await is built on.",
      "This example chains promises, compares the four Promise combinators, and finishes with a demonstration of the event loop: why promise callbacks run before timers.",
    ],
    concepts: [
      {
        term: "then, catch, finally",
        detail:
          "Each call returns a new promise, so steps can be chained. finally runs whether the chain succeeded or failed.",
      },
      {
        term: "all, race, any, allSettled",
        detail:
          "all needs every promise to succeed, race takes the first to settle, any takes the first to succeed, and allSettled reports on each one.",
      },
      {
        term: "Promise.withResolvers",
        detail:
          "Returns a promise together with its resolve and reject functions, so it can be settled from somewhere else (ES2024).",
      },
      {
        term: "Microtasks and macrotasks",
        detail:
          "Promise callbacks are microtasks: they run as soon as the current synchronous code finishes, before any timer callback.",
      },
    ],
    output: [
      "Chained result: 20",
      "Chain settled",
      "all: [ 'a', 'b' ]",
      "race: fast",
      "any: first success",
      "allSettled: fulfilled ok",
      "allSettled: rejected broken",
      "withResolvers: resolved from a timer",
      "1. synchronous code",
      "2. still synchronous",
      "3. promise callback (microtask)",
      "4. timer callback (macrotask)",
    ],
    tryNext: [
      "Make every promise passed to Promise.any fail, and catch the AggregateError it rejects with.",
      "Add a catch() to the first chain and throw inside one of the then() callbacks.",
      "Rewrite the chain at the top with async/await.",
    ],
  },
  {
    slug: "typescript-interfaces",
    exampleId: "ts-interfaces",
    heading: "TypeScript Interfaces Example",
    title: "TypeScript Interfaces Example",
    description:
      "A runnable TypeScript interfaces example: optional and readonly properties, extending interfaces, index signatures, function types and implements.",
    intro: [
      "An interface names the shape of an object: which properties it has and what types they hold. TypeScript checks every object against that shape, so a typo or a missing field is caught before the code runs.",
      "Interfaces exist only at compile time. The playground removes them when it transpiles to JavaScript, so they add no runtime cost.",
    ],
    concepts: [
      {
        term: "Optional and readonly",
        detail:
          "A ? marks a property that may be missing; readonly stops it from being reassigned after creation.",
      },
      {
        term: "extends",
        detail:
          "Builds a new interface from an existing one, adding properties without repeating the old ones.",
      },
      {
        term: "Function types and index signatures",
        detail:
          "Interfaces can describe callable values and dictionaries with arbitrary keys, not only fixed objects.",
      },
      {
        term: "implements",
        detail:
          "Makes a class promise to provide everything the interface lists; the compiler checks that it does.",
      },
    ],
    output: [
      "Ada (#1)",
      "Ada lives in London",
      "Postcode: not provided",
      "math: 98",
      "poetry: 87",
      "Beep boop, I am RX-78",
    ],
    tryNext: [
      "Uncomment ada.id = 2 to see the readonly error in the Problems panel.",
      'Add a "phone" property to Person and follow the errors to every object that now needs it.',
      "Remove greet() from Robot to see how implements reports the missing method.",
    ],
  },
  {
    slug: "typescript-generics",
    exampleId: "ts-generics",
    heading: "TypeScript Generics Example",
    title: "TypeScript Generics Example",
    description:
      "A runnable TypeScript generics example: generic functions, constraints with extends and keyof, default type parameters and utility types like Pick.",
    intro: [
      "Generics let you write one function or type that works with many types while keeping track of which type is in use. Instead of falling back to any, the type flows from the input to the output.",
      "Hover over a variable in the playground to see the type TypeScript inferred for it.",
    ],
    concepts: [
      {
        term: "Type parameters",
        detail:
          "<T> is a placeholder filled in at each call. Usually TypeScript infers it from the arguments.",
      },
      {
        term: "Constraints",
        detail:
          "T extends { length: number } accepts any type with a length property, such as strings and arrays, and rejects the rest.",
      },
      {
        term: "keyof and indexed access",
        detail:
          "K extends keyof T limits a parameter to the keys of T, and T[K] is the type stored under that key.",
      },
      {
        term: "Utility types",
        detail:
          "Pick, Partial and Record are generic types built into TypeScript for deriving new types from existing ones.",
      },
    ],
    output: [
      "10 alpha",
      "hello",
      "[ 1, 2, 3 ]",
      "[ 'Dune', 'Neuromancer' ]",
      "[ 1965, 1984 ]",
      "true Dune",
      "{ title: 'Snow Crash' } { year: 1992 }",
      "[ 'Dune', 'Neuromancer' ]",
    ],
    tryNext: [
      "Uncomment longest(10, 20) to see the constraint reject a number.",
      "Change the default error type of Result from string to Error.",
      "Write a generic last<T>() function next to first<T>().",
    ],
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** The example a guide explains. Throws if the data is inconsistent (checked by unit tests). */
export function guideExample(guide: Guide): CodeExample {
  const example = findExample(guide.exampleId);
  if (!example) throw new Error(`Unknown example "${guide.exampleId}"`);
  return example;
}
