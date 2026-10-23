import type { Faq } from "@/lib/content";
import type { Language } from "@/types/playground";

/**
 * Copy for the pages of the languages that run on WebAssembly (/python, /c,
 * …). Like content.ts, every claim describes implemented behaviour; the
 * JavaScript and TypeScript pages have pages of their own.
 */
export interface LanguagePage {
  language: Exclude<Language, "javascript" | "typescript">;
  /** Page title (the site name is appended) and H1. */
  title: string;
  /** 70–160 characters, for search results. */
  description: string;
  lead: string;
  capabilities: { title: string; text: string }[];
  available: string[];
  unavailable: string[];
  faqs: Faq[];
}

const PHONE_FAQ = (name: string, download: string): Faq => ({
  question: `Can I run ${name} on my phone or tablet?`,
  answer: `Yes. Everything runs in the browser, so any recent phone or tablet works, with nothing to install. The first time you pick ${name}, its runtime downloads once (about ${download}); after that it comes from your browser's cache. On touch screens a row of code keys gives you brackets, symbols, Tab and the arrow keys.`,
});

export const LANGUAGE_PAGES: LanguagePage[] = [
  {
    language: "python",
    title: "Online Python Compiler",
    description:
      "Write and run Python 3.14 online in your browser: the standard library, input() from an Input box and clear tracebacks. Free, works on phones.",
    lead: "Run real CPython 3.14 in your browser, with its standard library. Type a program, press Run and see what it prints. Programs that call input() read the Input tab, and errors link to the line that failed.",
    capabilities: [
      {
        title: "Real Python 3.14",
        text: "CPython compiled to WebAssembly (Pyodide), not a look-alike: classes, dataclasses, f-strings, comprehensions, generators, match statements and async code all behave as on your computer.",
      },
      {
        title: "input() and standard input",
        text: "Put the text your program should read in the Input tab. input(), sys.stdin and for line in sys.stdin read it line by line, as if typed into a terminal.",
      },
      {
        title: "Tracebacks you can follow",
        text: "An uncaught exception shows its type and message, the frames from your own code, and a link to the line that raised it.",
      },
      {
        title: "A fresh interpreter every run",
        text: "Each run starts clean, so a mistake in one run can't affect the next. The next interpreter starts in the background, so runs after the first are quick.",
      },
    ],
    available: [
      "The standard library: math, random, json, re, collections, itertools, datetime, dataclasses and more",
      "input(), sys.stdin and print()",
      "time.sleep and top-level await",
    ],
    unavailable: [
      "pip and third-party packages such as NumPy or pandas",
      "Files on your device and network access",
      "Windows and graphics (turtle, tkinter)",
    ],
    faqs: [
      {
        question: "Which Python version does it run?",
        answer:
          "CPython 3.14, built for WebAssembly by the Pyodide project, with its standard library.",
      },
      {
        question: "How do I give my program input?",
        answer:
          "Open the Input tab next to the Console and type what the program should read, one line per input() call. Each run reads it again from the start.",
      },
      {
        question: "Can I install packages with pip?",
        answer:
          "No. The sandbox has no network access, so only the standard library is available.",
      },
      PHONE_FAQ("Python", "7 MB"),
    ],
  },
  {
    language: "c",
    title: "Online C Compiler",
    description:
      "Compile and run C online with Clang 22: compiler errors as you type, scanf from an Input box and real exit codes. Free, works on phones and tablets.",
    lead: "Write C, and Clang compiles it right in your browser. Errors and warnings appear as you type, the program reads its input from the Input tab, and the console shows what it prints and how it exited.",
    capabilities: [
      {
        title: "A real compiler: Clang 22",
        text: "Your code is compiled by Clang (C17 with GNU extensions, -O1, -Wall) to WebAssembly, then run. It's the same compiler family used for native programs.",
      },
      {
        title: "Errors while you type",
        text: "Clang checks your code as you edit: errors and warnings are underlined in the editor and listed in the Problems panel with their line and column.",
      },
      {
        title: "scanf and standard input",
        text: "scanf, getchar and fgets read the Input tab. A program that reads input when the tab is empty gets a hint in the console.",
      },
      {
        title: "Crashes explained",
        text: "Exit codes are shown, and a crash such as an out-of-bounds memory access or an abort() is reported in plain words.",
      },
    ],
    available: [
      "stdio.h, stdlib.h, string.h, math.h, ctype.h, time.h and the rest of the C standard library",
      "Pointers, structs, malloc and free, with an 8 MB stack",
      "scanf, printf and exit codes",
    ],
    unavailable: [
      "Opening files (there is no filesystem)",
      "Network sockets and threads",
      "Libraries beyond the C standard library",
    ],
    faqs: [
      {
        question: "Which C compiler does it use?",
        answer:
          "Clang 22 and LLD built for WebAssembly (YoWASP), targeting WASI with wasi-libc. The C standard is C17 with GNU extensions.",
      },
      {
        question: "Why does the first compile take longer?",
        answer:
          "The compiler itself (about 27 MB) downloads the first time you use C or C++. Later compiles of a small program take well under a second.",
      },
      {
        question: "Does scanf work?",
        answer:
          "Yes. Type the input in the Input tab before pressing Run; scanf reads it from there.",
      },
      PHONE_FAQ("C", "27 MB"),
    ],
  },
  {
    language: "cpp",
    title: "Online C++ Compiler",
    description:
      "Compile and run C++20 online with Clang 22 and libc++: STL containers, algorithms, iostream and cin input. Free, in your browser, on any device.",
    lead: "Write modern C++ and run it in your browser. Clang compiles C++20 with the libc++ standard library, std::cin reads the Input tab, and compiler errors show up while you type.",
    capabilities: [
      {
        title: "C++20 with the standard library",
        text: "vector, map, set, unordered_map, string, algorithm, numeric, memory, lambdas, auto, range-based for loops and structured bindings, compiled by Clang 22.",
      },
      {
        title: "Errors while you type",
        text: "Compiler errors and warnings are underlined in the editor and listed in the Problems panel, including those from template code.",
      },
      {
        title: "cin and getline",
        text: "std::cin and std::getline read the Input tab, so programs that read numbers or lines work as they do in a terminal.",
      },
      {
        title: "Know how it ended",
        text: "The console shows the exit code, and crashes are reported in plain words instead of failing silently.",
      },
    ],
    available: [
      "The C++ standard library (libc++): containers, algorithms, strings, streams, smart pointers",
      "C++20 language features",
      "std::cin, std::cout and exit codes",
    ],
    unavailable: [
      "Catching exceptions: a throw ends the program with its message, and catch blocks do not run",
      "Threads, files and network access",
      "Third-party libraries such as Boost",
    ],
    faqs: [
      {
        question: "Which C++ standard is used?",
        answer:
          "C++20, compiled by Clang 22 with libc++, optimized with -O1 and warnings from -Wall.",
      },
      {
        question: "Why don't my try/catch blocks work?",
        answer:
          "The WebAssembly build of the C++ library has no exception support. A throw stops the program and prints the exception's type and message, so you can still see what went wrong.",
      },
      {
        question: "Why does compiling take a few seconds?",
        answer:
          "Headers such as iostream are large, and the compiler runs on your device. The first compile also downloads the compiler (about 27 MB) once.",
      },
      PHONE_FAQ("C++", "27 MB"),
    ],
  },
  {
    language: "go",
    title: "Online Go Playground",
    description:
      "Run Go online in your browser: structs, interfaces, goroutines, channels and the standard library, with stdin from an Input box. Free, works on phones.",
    lead: "Write Go and run it instantly in your browser. Goroutines, channels, interfaces and most of the standard library work, os.Stdin reads the Input tab, and compile errors link to their line.",
    capabilities: [
      {
        title: "Go without installing Go",
        text: "Your program runs on Yaegi, a Go interpreter, built with the Go 1.25 standard library: fmt, strings, sort, strconv, bufio, time, sync and more.",
      },
      {
        title: "Goroutines and channels",
        text: "go statements, channels, select, sync.WaitGroup and time.Sleep all work, so you can try out Go's concurrency.",
      },
      {
        title: "Standard input",
        text: "bufio.Scanner and fmt.Scan read os.Stdin from the Input tab, line by line.",
      },
      {
        title: "Errors with their position",
        text: "Compile errors such as an undefined name link to their line and column; panics show their message.",
      },
    ],
    available: [
      "package main programs with structs, methods, interfaces and closures",
      "Goroutines, channels and the sync package",
      "fmt, strings, strconv, sort, math, bufio, time and other standard packages",
    ],
    unavailable: [
      "Modules and packages outside the standard library",
      "Networking, os/exec and unsafe",
      "Exactly the Go compiler's behaviour in every edge case (it is an interpreter)",
    ],
    faqs: [
      {
        question: "Is this the official Go compiler?",
        answer:
          "No. Programs run on Yaegi, an interpreter for Go built with the Go 1.25 standard library. Ordinary programs behave the same; very unusual code may not.",
      },
      {
        question: "Do goroutines work?",
        answer:
          "Yes. Goroutines, channels, select, sync.WaitGroup and time.Sleep all work.",
      },
      {
        question: "How do I read input?",
        answer:
          "Type it in the Input tab, then read os.Stdin, for example with bufio.NewScanner(os.Stdin).",
      },
      PHONE_FAQ("Go", "9 MB"),
    ],
  },
  {
    language: "ruby",
    title: "Online Ruby Compiler",
    description:
      "Run Ruby 3.4 online in your browser: classes, blocks, hashes and the standard library, with gets reading an Input box. Free, works on phones and tablets.",
    lead: "Run real Ruby 3.4 in your browser. Classes, blocks, hashes, string methods and the standard library are all there; gets reads the Input tab, and exceptions link to the line that raised them.",
    capabilities: [
      {
        title: "CRuby 3.4",
        text: "The reference Ruby implementation compiled to WebAssembly (ruby.wasm), with its standard library bundled.",
      },
      {
        title: "Blocks, iterators and objects",
        text: "each, map, select, reduce, group_by, Struct, modules, mixins and endless methods behave exactly as in Ruby on your computer.",
      },
      {
        title: "gets and standard input",
        text: "gets, STDIN.read and $stdin.each_line read the Input tab.",
      },
      {
        title: "Clear exceptions",
        text: "Uncaught exceptions show their class and message, with a link to the line in your code.",
      },
    ],
    available: [
      "The core classes and the standard library",
      "gets, puts, print, p and pp",
      "Exceptions, exit and exit codes",
    ],
    unavailable: [
      "Installing gems",
      "Files on your device and network access",
      "Threads that run in parallel",
    ],
    faqs: [
      {
        question: "Which Ruby version is it?",
        answer: "CRuby 3.4, built for WebAssembly by the ruby.wasm project.",
      },
      {
        question: "Can I use gems?",
        answer:
          "Only the standard library: there is no network access to install gems.",
      },
      {
        question: "How do I read input with gets?",
        answer:
          "Type the input in the Input tab; each gets call reads the next line.",
      },
      PHONE_FAQ("Ruby", "9 MB"),
    ],
  },
  {
    language: "php",
    title: "Online PHP Sandbox",
    description:
      "Run PHP 8.4 online in your browser like php main.php: classes, enums, arrays, json and STDIN from an Input box. Free, works on phones and tablets.",
    lead: "Run PHP 8.4 scripts in your browser, the way php main.php runs them in a terminal. Output appears in the console, errors and warnings in red, and STDIN reads the Input tab.",
    capabilities: [
      {
        title: "PHP 8.4 command line",
        text: "The PHP interpreter compiled to WebAssembly (from WordPress Playground), running your file as a command-line script.",
      },
      {
        title: "Modern PHP",
        text: "Typed properties, readonly classes, enums, match, named arguments, arrow functions and first-class callables.",
      },
      {
        title: "STDIN and exit codes",
        text: "fgets(STDIN) and stream_get_contents(STDIN) read the Input tab, and the console shows the script's exit code.",
      },
      {
        title: "PHP's own error messages",
        text: "Notices, warnings and fatal errors are printed as PHP prints them, with the file and line.",
      },
    ],
    available: [
      "String, array, math and date functions",
      "json_encode, json_decode and preg_* regular expressions",
      "echo, printf and STDIN",
    ],
    unavailable: [
      "A web server: $_GET, $_POST and HTML pages are not served",
      "Databases, files on your device and network access",
      "Composer packages",
    ],
    faqs: [
      {
        question: "Which PHP version is it?",
        answer:
          "PHP 8.4, built for WebAssembly by the WordPress Playground project.",
      },
      {
        question: "Can I build a web page with it?",
        answer:
          "Scripts run on the command line, so they print text rather than serve pages. echo, printf and string output all appear in the console.",
      },
      {
        question: "How do I read input?",
        answer:
          "Type it in the Input tab and read it with fgets(STDIN) or stream_get_contents(STDIN).",
      },
      PHONE_FAQ("PHP", "8 MB"),
    ],
  },
  {
    language: "lua",
    title: "Online Lua Compiler",
    description:
      "Run Lua 5.4 online in your browser: tables, closures, metatables, coroutines and io.read from an Input box. Free, with a tiny download for phones and tablets.",
    lead: "Run Lua 5.4 in your browser. It's a tiny download, so it starts almost instantly even on a slow connection. io.read reads the Input tab, and errors link to the line that failed.",
    capabilities: [
      {
        title: "Lua 5.4",
        text: "The reference Lua interpreter compiled to WebAssembly (wasmoon), with its standard libraries: string, table, math, os, utf8 and coroutine.",
      },
      {
        title: "Tables, closures and metatables",
        text: "Everything that makes Lua Lua: tables as arrays and objects, closures, metatables, string patterns and integer division.",
      },
      {
        title: "io.read and io.write",
        text: "io.read with the l, n, a and number formats reads the Input tab; print and io.write go to the console.",
      },
      {
        title: "Quick to load",
        text: "The whole runtime is about 0.2 MB, so Lua is ready a moment after you pick it.",
      },
    ],
    available: [
      "The string, table, math, os, utf8 and coroutine libraries",
      "print, io.write and io.read",
      "Errors with their line",
    ],
    unavailable: [
      "require of other files and C modules",
      "Files on your device and network access",
      "LuaRocks packages",
    ],
    faqs: [
      {
        question: "Which Lua version is it?",
        answer:
          "Lua 5.4, the reference interpreter, built for WebAssembly by wasmoon.",
      },
      {
        question: "Does io.read work?",
        answer:
          "Yes. Type the input in the Input tab; io.read reads lines, numbers or everything that is left.",
      },
      {
        question: "Can I use coroutines?",
        answer: "Yes, coroutine.create, resume, yield and wrap all work.",
      },
      PHONE_FAQ("Lua", "0.2 MB"),
    ],
  },
  {
    language: "r",
    title: "Online R Compiler",
    description:
      "Run R 4.6 online in your browser: vectors, data frames, statistics, lm() and built-in datasets like mtcars. Free, no install, works on phones and tablets.",
    lead: "Run R 4.6 in your browser for statistics and data analysis. Vectors, data frames, apply functions, lm() and the built-in datasets are all there, and values print just as they do in R.",
    capabilities: [
      {
        title: "R 4.6",
        text: "The R interpreter compiled to WebAssembly (webR), with base R and its standard packages: stats, utils, methods and datasets.",
      },
      {
        title: "Runs like Rscript",
        text: "Each top-level expression is evaluated in turn and visible values are printed, so a data frame or a summary() shows up in the console.",
      },
      {
        title: "Statistics built in",
        text: "mean, sd, quantile, table, aggregate, lm, t.test and friends, with datasets such as mtcars, iris and airquality to try them on.",
      },
      {
        title: "Readable errors",
        text: "Errors read like R's own (Error in f(): …) and link to the line; warnings appear as they happen.",
      },
    ],
    available: [
      "Base R with stats, utils, methods and datasets",
      "Vectors, lists, factors and data frames",
      "Built-in datasets such as mtcars and iris",
    ],
    unavailable: [
      "Installing packages (tidyverse, ggplot2 and others)",
      "Plots and graphics",
      "Reading input or files from your device",
    ],
    faqs: [
      {
        question: "Which version of R is it?",
        answer: "R 4.6, built for WebAssembly by the webR project.",
      },
      {
        question: "Can I install packages?",
        answer:
          "No. The sandbox has no network access, so only base R and its standard packages are available.",
      },
      {
        question: "Can I make plots?",
        answer:
          "Not yet: the playground shows text output only. Summaries, tables and printed data frames work.",
      },
      PHONE_FAQ("R", "15 MB"),
    ],
  },
];

export function languagePage(language: LanguagePage["language"]): LanguagePage {
  return LANGUAGE_PAGES.find((page) => page.language === language)!;
}
