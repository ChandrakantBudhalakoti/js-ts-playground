import { expect, test } from "@playwright/test";
import { LANGUAGE_EXAMPLES } from "../../src/lib/language-examples";
import { languageInfo } from "../../src/lib/languages";
import {
  consoleOutput,
  expectLanguage,
  expectStatus,
  loggedLines,
  openPlayground,
  run,
  selectLanguage,
} from "./helpers";

/**
 * Languages that run on WebAssembly runtimes. Their first run downloads the
 * runtime (or Clang) from the app, so these tests allow more time. They run
 * in their own projects, after the other suites (playwright.config.ts).
 */
test.describe.configure({ timeout: 180_000 });

/**
 * A line each example prints, proving the program ran to its end. It is
 * looked for in the whole console: printed text is batched into entries by
 * timing, so on a slow machine a line can land in any entry.
 */
const EXPECTED_OUTPUT: Record<string, string> = {
  "py-hello": "Hello, Ada! You know 2 languages.",
  // Also shows that both input lines were read.
  "py-input": "Sum: 12 Average: 4.0",
  "c-hello": "First 10 primes: 2 3 5 7 11 13 17 19 23 29",
  "c-input": "Read 5 numbers: sum 24, max 9, average 4.80",
  "c-pointers": "Reversed: 1 4 9 16 25",
  "cpp-hello": "Total area: 19.0686",
  "cpp-stl": "Sum 1..10 = 55, even numbers: 5",
  "cpp-input": "You listed 3 languages: C++ Python Go",
  "go-hello": "Word counts: map[and:1 fast:1 fun:1 go:2 is:2]",
  "go-concurrency": "6 results",
  "go-input": "Total: 10",
  "rb-hello": "Sum of the even numbers up to 10: 30",
  "rb-input": "Total: 60, largest: 30",
  "php-hello": "Inventory value: 1,946.88",
  "php-input": "Sum: 108, max: 42",
  "lua-hello": "Average age: 34",
  "lua-input": "3 numbers, sum 31",
  "r-hello": "Margaret    97 Assembly",
  "r-stats": "Each 1000 lb costs about 5.3 mpg",
};

/** Long-running compiles get a generous limit; runs keep the default. */
const STATUS_TIMEOUT = 120_000;

test.describe("examples in every language", () => {
  for (const example of LANGUAGE_EXAMPLES) {
    test(`${example.id} runs`, async ({ page, browserName }) => {
      // Firefox runs one example per language (the sandbox differs per browser).
      test.skip(
        browserName === "firefox" && !example.id.endsWith("-hello"),
        "one example per language in Firefox",
      );
      await openPlayground(page, { query: `example=${example.id}` });
      await expectLanguage(page, languageInfo(example.language).name);
      await run(page);
      if (example.id === "py-errors") {
        await expectStatus(page, "failed", STATUS_TIMEOUT);
        await expect(loggedLines(page)).toContainText([
          "Could not parse 'abc'",
        ]);
        const error = consoleOutput(page).locator(
          '[data-kind="runtime-error"]',
        );
        await expect(error).toContainText(
          "ZeroDivisionError: division by zero",
        );
        await expect(
          error.getByRole("button", { name: /Go to main\.py line 16/ }),
        ).toBeVisible();
        return;
      }
      await expectStatus(page, "completed", STATUS_TIMEOUT);
      await expect(consoleOutput(page)).toContainText(
        EXPECTED_OUTPUT[example.id],
      );
    });
  }

  test("every example has an expected output", () => {
    for (const example of LANGUAGE_EXAMPLES) {
      if (example.id === "py-errors") continue;
      expect(EXPECTED_OUTPUT[example.id], example.id).toBeTruthy();
    }
  });
});

test.describe("standard input", () => {
  test("the Input panel is the program's standard input", async ({ page }) => {
    await openPlayground(page, {
      language: "python",
      code: "import sys\nfor line in sys.stdin:\n    print(line.strip().upper())\n",
      stdin: "first\n",
    });
    await page.getByRole("tab", { name: /Input/ }).click();
    await page.getByTestId("stdin-input").fill("alpha\nbeta\n");
    await run(page);
    await expectStatus(page, "completed", STATUS_TIMEOUT);
    await expect(loggedLines(page)).toContainText(["ALPHA\nBETA"]);
  });

  test("JavaScript has no Input tab", async ({ page }) => {
    await openPlayground(page, { language: "python", code: "print(1)" });
    await expect(page.getByRole("tab", { name: /Input/ })).toBeVisible();
    await selectLanguage(page, "JavaScript");
    await expect(page.getByRole("tab", { name: /Input/ })).toHaveCount(0);
  });
});

test.describe("errors in other languages", () => {
  test("C compile errors are listed in Problems with their location", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "c",
      code: "int main(void) {\n  int x = 1\n  return x;\n}\n",
    });
    await run(page);
    await expectStatus(page, "failed", STATUS_TIMEOUT);
    await expect(page.getByTestId("problem-item").first()).toContainText(
      "expected ';'",
    );
    await expect(page.getByTestId("problem-item").first()).toContainText(
      "main.c:2:",
    );
    // A plain-language explanation under it (src/lib/friendly-errors).
    await expect(
      page.getByTestId("problems-list").getByTestId("friendly-error").first(),
    ).toContainText("A semicolon (;) is missing");
  });

  test("a Python indentation error is explained in plain language", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "python",
      code: "count = 3\n    print(count)\n",
    });
    await run(page);
    await expectStatus(page, "failed", STATUS_TIMEOUT);
    const error = consoleOutput(page).locator('[data-kind="runtime-error"]');
    await expect(error).toContainText("IndentationError");
    await expect(error.getByTestId("friendly-error")).toContainText(
      "Line 2 has extra spaces at the start",
    );
  });

  test("a C program's exit status fails the run", async ({ page }) => {
    await openPlayground(page, {
      language: "c",
      code: '#include <stdio.h>\nint main(void) { printf("bye"); return 3; }\n',
    });
    await run(page);
    await expectStatus(page, "failed", STATUS_TIMEOUT);
    await expect(loggedLines(page)).toContainText(["bye"]);
    await expect(consoleOutput(page)).toContainText("Exited with code 3");
  });

  test("an uncaught C++ exception is reported", async ({ page }) => {
    await openPlayground(page, {
      language: "cpp",
      code: '#include <stdexcept>\nint main() { throw std::runtime_error("boom"); }\n',
    });
    await run(page);
    await expectStatus(page, "failed", STATUS_TIMEOUT);
    await expect(
      consoleOutput(page).locator('[data-level="error"][data-kind="log"]'),
    ).toContainText("'std::runtime_error': boom");
  });

  test("Go compile errors link to their line", async ({ page }) => {
    await openPlayground(page, {
      language: "go",
      code: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println(missing)\n}\n',
    });
    await run(page);
    await expectStatus(page, "failed", STATUS_TIMEOUT);
    const error = consoleOutput(page).locator('[data-kind="runtime-error"]');
    await expect(error).toContainText("undefined: missing");
    await expect(
      error.getByRole("button", { name: /Go to main\.go line 6/ }),
    ).toBeVisible();
  });

  test("an infinite loop is stopped by the time limit, keeping its output", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "python",
      code: 'print("before the loop")\nwhile True:\n    pass\n',
      settings: { timeoutMs: 2_000 },
    });
    await run(page);
    await expectStatus(page, "timed-out", STATUS_TIMEOUT);
    await expect(loggedLines(page)).toContainText(["before the loop"]);
  });

  test("the sandbox has no network access, even past the worker's fetch replacement", async ({
    page,
  }) => {
    // The worker's fetch replacement is only a convenience: code can delete
    // it and reach the browser's own fetch. The sandbox CSP must block that.
    await openPlayground(page, {
      language: "python",
      code: [
        "import js",
        'js.eval("delete self.fetch")',
        'print("native fetch:", "[native code]" in js.eval("String(self.fetch)"))',
        "try:",
        '    await js.fetch("https://example.com/")',
        '    print("network reachable")',
        "except Exception as error:",
        '    print("blocked:", type(error).__name__)',
      ].join("\n"),
    });
    await run(page);
    await expectStatus(page, "completed", STATUS_TIMEOUT);
    // Printed lines may be batched into one console entry.
    const output = consoleOutput(page);
    await expect(output).toContainText("native fetch: True");
    await expect(output).toContainText("blocked:");
    await expect(output).not.toContainText("network reachable");
  });
});
