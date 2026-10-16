import type { CodeExample, Language } from "@/types/playground";

export const EXAMPLES: CodeExample[] = [
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

export const DEFAULT_EXAMPLE: Record<Language, CodeExample> = {
  typescript: EXAMPLES.find((e) => e.id === "ts-hello")!,
  javascript: EXAMPLES.find((e) => e.id === "js-basics")!,
};

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
