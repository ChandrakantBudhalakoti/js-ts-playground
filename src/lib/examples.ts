import { LANGUAGE_EXAMPLES } from "@/lib/language-examples";
import { type Level, PROGRAM_EXAMPLES } from "@/lib/programs";
import { LANGUAGES } from "@/lib/languages";
import type { CodeExample, Language } from "@/types/playground";

const SCRIPT_EXAMPLES: CodeExample[] = [
  {
    id: "ts-hello",
    title: "Hello, TypeScript",
    description: "Interfaces, typed functions and generics",
    language: "typescript",
    code: `interface User {
  id: number;
  name: string;
  email?: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

function firstOrDefault<T>(items: T[], fallback: T): T {
  return items.length > 0 ? items[0] : fallback;
}

const users: User[] = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Linus", email: "linus@example.com" },
];

console.log(greet(users[0]));
console.info("First user:", firstOrDefault(users, { id: 0, name: "Nobody" }));
console.log("Users with email:", users.filter((u) => u.email !== undefined).length);
`,
  },
  {
    id: "ts-interfaces",
    title: "Interfaces",
    description: "Optional, readonly and extended object shapes",
    language: "typescript",
    code: `// Interfaces describe the shape of an object.
interface Address {
  street: string;
  city: string;
  postcode?: string; // optional
}

interface Person {
  readonly id: number; // can't be reassigned
  name: string;
  address: Address;
}

// An Employee is a Person with extra fields.
interface Employee extends Person {
  role: "engineer" | "designer" | "manager";
  skills: string[];
}

// Interfaces can describe functions and dictionaries too.
interface Formatter {
  (person: Person): string;
}

interface Scores {
  [subject: string]: number;
}

const formatName: Formatter = (person) => \`\${person.name} (#\${person.id})\`;

const ada: Employee = {
  id: 1,
  name: "Ada",
  address: { street: "12 Analytical Way", city: "London" },
  role: "engineer",
  skills: ["math", "programming"],
};

console.log(formatName(ada));
console.log(\`\${ada.name} lives in \${ada.address.city}\`);
console.log("Postcode:", ada.address.postcode ?? "not provided");

const scores: Scores = { math: 98, poetry: 87 };
for (const [subject, score] of Object.entries(scores)) {
  console.log(\`\${subject}: \${score}\`);
}

// A class can promise to implement an interface.
interface Greeter {
  greet(): string;
}

class Robot implements Greeter {
  constructor(private model: string) {}

  greet() {
    return \`Beep boop, I am \${this.model}\`;
  }
}

console.log(new Robot("RX-78").greet());

// Uncomment a line to see the type checker catch it:
// ada.id = 2;
// ada.role = "intern";
`,
  },
  {
    id: "ts-generics",
    title: "Generics",
    description: "Generic functions, constraints and utility types",
    language: "typescript",
    code: `// Generics let one function work with many types, without losing type safety.
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const firstNumber = first([10, 20, 30]); // number | undefined
const firstWord = first(["alpha", "beta"]); // string | undefined
console.log(firstNumber, firstWord);

// Constraints: T must have a length property.
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

console.log(longest("hello", "hi"));
console.log(longest([1, 2, 3], [4]));

// keyof: K must be one of T's keys, and the result type follows from it.
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const books = [
  { title: "Dune", year: 1965 },
  { title: "Neuromancer", year: 1984 },
];

console.log(pluck(books, "title")); // string[]
console.log(pluck(books, "year")); // number[]

// Generic interfaces, with a default type parameter.
interface Result<T, E = string> {
  ok: boolean;
  value?: T;
  error?: E;
}

function succeed<T>(value: T): Result<T> {
  return { ok: true, value };
}

const result = succeed({ id: 7, title: "Dune" });
console.log(result.ok, result.value?.title);

// Built-in generic utility types.
type Book = (typeof books)[number];
type BookPreview = Pick<Book, "title">;
type BookDraft = Partial<Book>;

const preview: BookPreview = { title: "Snow Crash" };
const draft: BookDraft = { year: 1992 };
const byTitle: Record<string, Book> = Object.fromEntries(
  books.map((book) => [book.title, book]),
);

console.log(preview, draft);
console.log(Object.keys(byTitle));

// Uncomment a line to see the constraints reject it:
// longest(10, 20);
// pluck(books, "author");
`,
  },
  {
    id: "js-basics",
    title: "JavaScript basics",
    description: "Variables, functions, loops and console.log",
    language: "javascript",
    code: `const language = "JavaScript";
let count = 3;

function shout(text) {
  return text.toUpperCase() + "!";
}

console.log("Hello from", language);
console.log(shout("hello world"));

for (let i = 1; i <= count; i++) {
  console.log(\`Iteration \${i} of \${count}\`);
}

const square = (n) => n * n;
console.log("Squares:", [1, 2, 3, 4].map(square));
`,
  },
  {
    id: "js-arrays-objects",
    title: "Arrays & objects",
    description: "map, filter, reduce, destructuring and spread",
    language: "javascript",
    code: `const products = [
  { name: "Keyboard", price: 49.99, tags: ["hardware", "input"] },
  { name: "Monitor", price: 189.0, tags: ["hardware", "display"] },
  { name: "IDE license", price: 89.0, tags: ["software"] },
];

const hardware = products.filter((p) => p.tags.includes("hardware"));
const names = products.map(({ name }) => name);
const total = products.reduce((sum, p) => sum + p.price, 0);

console.log("Names:", names);
console.log("Hardware:", hardware);
console.log("Total: $" + total.toFixed(2));

const byTag = Object.groupBy(
  products.flatMap((p) => p.tags.map((tag) => ({ tag, name: p.name }))),
  (entry) => entry.tag,
);
console.log("Grouped by tag:", byTag);

const updated = { ...products[0], price: 39.99, onSale: true };
console.log("Updated copy:", updated);
console.log("Entries:", Object.entries(updated));
`,
  },
  {
    id: "ts-type-errors",
    title: "Type errors (diagnostics demo)",
    description: "Intentionally invalid types; see the Problems panel",
    language: "typescript",
    code: `// This file contains deliberate type errors. They appear in the
// Problems panel and as squiggles. By default you can still run it.

const age: number = "25";

interface Point {
  x: number;
  y: number;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

console.log(distance({ x: 0, y: 0 }, { x: 3 }));
console.log(age.toFixed(1));
`,
  },
  {
    id: "ts-classes",
    title: "Classes & generics",
    description: "A typed stack with access modifiers",
    language: "typescript",
    code: `class Stack<T> {
  #items: T[] = [];

  push(...items: T[]): this {
    this.#items.push(...items);
    return this;
  }

  pop(): T | undefined {
    return this.#items.pop();
  }

  peek(): T | undefined {
    return this.#items.at(-1);
  }

  get size(): number {
    return this.#items.length;
  }
}

const stack = new Stack<string>().push("a", "b", "c");
console.log("Size:", stack.size);
console.log("Peek:", stack.peek());
console.log("Pop:", stack.pop(), stack.pop());
console.log("Remaining:", stack.size);

type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
  }
}

const shapes: Shape[] = [
  { kind: "circle", radius: 1 },
  { kind: "rect", width: 2, height: 3 },
];
for (const shape of shapes) {
  console.log(shape.kind, area(shape).toFixed(2));
}
`,
  },
  {
    id: "js-async",
    title: "Async & timers",
    description: "Promises, async/await and setTimeout",
    language: "javascript",
    code: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchUser(id) {
  await sleep(200);
  if (id < 0) throw new Error("Invalid user id");
  return { id, name: "User " + id };
}

console.log("Starting…");
console.time("all users");
const users = await Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)]);
console.timeEnd("all users");
console.log(users);

try {
  await fetchUser(-1);
} catch (error) {
  console.warn("Caught:", error.message);
}

setTimeout(() => console.log("Timers are tracked: the run completes after this."), 300);
`,
  },
  {
    id: "js-array-methods",
    title: "Array methods",
    description: "map, filter, reduce, find, toSorted and groupBy",
    language: "javascript",
    code: `const orders = [
  { id: 1, customer: "Ada", total: 42.5, status: "paid" },
  { id: 2, customer: "Grace", total: 120, status: "pending" },
  { id: 3, customer: "Linus", total: 15.25, status: "paid" },
  { id: 4, customer: "Ada", total: 99.99, status: "refunded" },
];

// Transform: filter keeps items, map changes them, reduce combines them.
const paidTotals = orders
  .filter((order) => order.status === "paid")
  .map((order) => order.total);
const revenue = paidTotals.reduce((sum, total) => sum + total, 0);
console.log("Paid totals:", paidTotals);
console.log("Revenue:", revenue.toFixed(2));

// Search: find, findLast, some and every.
console.log("First order over 100:", orders.find((o) => o.total > 100)?.id);
console.log("Ada's last order:", orders.findLast((o) => o.customer === "Ada")?.id);
console.log("Any pending?", orders.some((o) => o.status === "pending"));
console.log("All positive?", orders.every((o) => o.total > 0));

// Copy instead of mutating: toSorted and toReversed leave the original alone.
const largestFirst = orders.toSorted((a, b) => b.total - a.total);
console.log("Ids by total:", largestFirst.map((o) => o.id));
console.log("Original order:", orders.map((o) => o.id));
console.log("Reversed copy:", orders.toReversed().map((o) => o.id));

// Reshape: unique values, grouping, and building arrays.
const customers = [...new Set(orders.map((o) => o.customer))];
console.log("Customers:", customers);

const byStatus = Object.groupBy(orders, (o) => o.status);
console.log("Paid order ids:", byStatus.paid.map((o) => o.id));
console.log("Last order:", orders.at(-1).id);
console.log("Evens:", Array.from({ length: 5 }, (_, i) => i * 2));
`,
  },
  {
    id: "js-async-await",
    title: "Async/await",
    description: "Sequential vs. parallel awaits and error handling",
    language: "javascript",
    code: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// An async function always returns a promise.
async function loadUser(id) {
  await sleep(100); // stands in for a network request
  if (id <= 0) throw new Error(\`No user with id \${id}\`);
  return { id, name: \`User \${id}\` };
}

// 1. Sequential: each await waits for the one before it (about 300 ms).
let start = Date.now();
for (const id of [1, 2, 3]) {
  const user = await loadUser(id);
  console.log("Loaded", user.name);
}
const sequentialMs = Date.now() - start;

// 2. Parallel: start every request first, then await them together (about 100 ms).
start = Date.now();
const users = await Promise.all([1, 2, 3].map(loadUser));
const parallelMs = Date.now() - start;
console.log("Loaded in parallel:", users.map((user) => user.name));
console.log("Parallel was faster:", parallelMs < sequentialMs);

// 3. A rejected promise throws at the await, so try/catch works.
try {
  await loadUser(0);
} catch (error) {
  console.warn("Caught:", error.message);
} finally {
  console.log("finally runs either way");
}

// 4. Calling an async function without await gives you the promise.
const pending = loadUser(4);
console.log("Is a promise:", pending instanceof Promise);
console.log("Resolved to:", (await pending).name);
`,
  },
  {
    id: "js-promises",
    title: "Promises",
    description: "Chaining, combinators and event-loop order",
    language: "javascript",
    code: `const wait = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));
const fail = (ms, reason) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(reason)), ms));

// Chaining: every then() returns a new promise.
await wait(50, 2)
  .then((n) => n * 10)
  .then((n) => console.log("Chained result:", n))
  .finally(() => console.log("Chain settled"));

// Combinators wait for several promises at once.
console.log("all:", await Promise.all([wait(30, "a"), wait(10, "b")]));
console.log("race:", await Promise.race([wait(30, "slow"), wait(10, "fast")]));
console.log("any:", await Promise.any([fail(10, "nope"), wait(20, "first success")]));

const settled = await Promise.allSettled([wait(10, "ok"), fail(10, "broken")]);
for (const result of settled) {
  const detail = result.status === "fulfilled" ? result.value : result.reason.message;
  console.log("allSettled:", result.status, detail);
}

// Promise.withResolvers (ES2024) hands you resolve and reject directly.
const { promise, resolve } = Promise.withResolvers();
setTimeout(() => resolve("resolved from a timer"), 10);
console.log("withResolvers:", await promise);

// Event loop order: synchronous code, then microtasks, then timers.
setTimeout(() => console.log("4. timer callback (macrotask)"), 0);
Promise.resolve().then(() => console.log("3. promise callback (microtask)"));
console.log("1. synchronous code");
console.log("2. still synchronous");
`,
  },
  {
    id: "js-console",
    title: "Console API tour",
    description: "Levels, groups, counters and tricky values",
    language: "javascript",
    code: `console.log("log: plain output");
console.info("info: something useful");
console.warn("warn: be careful");
console.error("error: something went wrong");
console.debug("debug: details for later");

console.group("A group");
console.log("indented");
console.count("clicks");
console.count("clicks");
console.groupEnd();

console.log("Format %s has %d items", "this list", 3);

const circular = { name: "root" };
circular.self = circular;
console.log("Circular:", circular);

console.log(new Map([["a", 1], ["b", 2]]), new Set([1, 2, 3]));
console.log(undefined, null, NaN, -0, 10n, Symbol("id"));
console.log(function namedFn() {}, class Thing {}, new Date(0), /re/g);
console.log(new Error("errors are values too"));
`,
  },
  {
    id: "js-errors",
    title: "Error handling",
    description: "try/catch, then an uncaught exception",
    language: "javascript",
    code: `function parseConfig(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn("Could not parse config:", error.message);
    return {};
  }
}

console.log(parseConfig('{"debug": true}'));
console.log(parseConfig("not json"));

function divide(a, b) {
  if (b === 0) {
    throw new RangeError("Division by zero");
  }
  return a / b;
}

console.log(divide(10, 2));
console.log(divide(1, 0)); // Uncaught: shows the error and its location
`,
  },
  {
    id: "js-infinite-loop",
    title: "Infinite loop (timeout demo)",
    description: "The sandbox is terminated when the time limit is hit",
    language: "javascript",
    code: `console.log("Entering an infinite loop…");
console.log("The playground stops it when the time limit is reached (see Settings).");

while (true) {
  // Never ends. Press Stop, or wait for the timeout.
}
`,
  },
];

export const EXAMPLES: CodeExample[] = [
  ...SCRIPT_EXAMPLES,
  ...LANGUAGE_EXAMPLES,
  ...PROGRAM_EXAMPLES,
];

/** Hand-written examples that need more than the basics. */
const ADVANCED = new Set([
  "ts-generics",
  "js-async",
  "js-async-await",
  "js-promises",
  "c-pointers",
  "go-concurrency",
]);

/**
 * How hard an example is. The beginner programs carry their own level; the
 * other examples are intermediate unless listed in `ADVANCED`.
 */
export function exampleLevel(example: CodeExample): Level {
  return (
    example.level ?? (ADVANCED.has(example.id) ? "advanced" : "intermediate")
  );
}

const PROGRAM_IDS = new Set(PROGRAM_EXAMPLES.map((example) => example.id));

/** Whether an example is one of the beginner programs (src/lib/programs). */
export function isProgramExample(example: CodeExample): boolean {
  return PROGRAM_IDS.has(example.id);
}

/** Starter code per language: the first example of other languages. */
export const DEFAULT_EXAMPLE = Object.fromEntries(
  LANGUAGES.map(({ id }) => [
    id,
    id === "typescript"
      ? EXAMPLES.find((e) => e.id === "ts-hello")!
      : id === "javascript"
        ? EXAMPLES.find((e) => e.id === "js-basics")!
        : EXAMPLES.find((e) => e.language === id)!,
  ]),
) as Record<Language, CodeExample>;

/** Query parameter that opens an example in the playground: `/playground?example=<id>`. */
export const EXAMPLE_PARAM = "example";

/** Link that opens an example in the playground. */
export function playgroundHref(exampleId: string): string {
  return `/playground?${EXAMPLE_PARAM}=${encodeURIComponent(exampleId)}`;
}

export function findExample(id: string): CodeExample | undefined {
  return EXAMPLES.find((example) => example.id === id);
}

export function isStarterCode(code: string): boolean {
  const normalized = code.trim();
  return (
    normalized === "" ||
    EXAMPLES.some((example) => example.code.trim() === normalized)
  );
}
