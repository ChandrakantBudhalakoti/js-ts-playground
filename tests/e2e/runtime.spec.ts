import { expect, test } from "@playwright/test";
import {
  consoleOutput,
  expectStatus,
  openPlayground,
  run,
  setCode,
  status,
} from "./helpers";

test.describe("JavaScript runtime", () => {
  test("console.log output is displayed", async ({ page }) => {
    await openPlayground(page, { code: "console.log('Hello World')" });
    await run(page);
    await expectStatus(page, "completed");
    await expect(
      consoleOutput(page).locator('[data-level="log"][data-kind="log"]'),
    ).toHaveText(/Hello World/);
  });

  test("console levels are distinguished", async ({ page }) => {
    await openPlayground(page, {
      code: "console.info('i'); console.warn('careful'); console.error('broken'); console.debug('dbg');",
    });
    await run(page);
    await expectStatus(page, "completed");
    const output = consoleOutput(page);
    await expect(
      output.locator('[data-kind="log"][data-level="warn"]'),
    ).toHaveText(/careful/);
    await expect(
      output.locator('[data-kind="log"][data-level="error"]'),
    ).toHaveText(/broken/);
    await expect(
      output.locator('[data-kind="log"][data-level="info"]'),
    ).toHaveText(/i/);
    await expect(
      output.locator('[data-kind="log"][data-level="debug"]'),
    ).toHaveText(/dbg/);
  });

  test("uncaught errors are shown with their location", async ({ page }) => {
    await openPlayground(page, {
      code: "console.log('before');\n\nthrow new Error('Test error');\n",
    });
    await run(page);
    await expectStatus(page, "failed");
    const error = consoleOutput(page).locator('[data-kind="runtime-error"]');
    await expect(error).toContainText("Uncaught Error: Test error");
    await expect(
      error.getByRole("button", { name: /line 3, column/ }),
    ).toBeVisible();
  });

  test("valid TypeScript transpiles and runs, with errors mapped to TS lines", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "typescript",
      code: [
        "interface Point { x: number; y: number }",
        "",
        "type Pair = [Point, Point];",
        "const pair: Pair = [{ x: 1, y: 2 }, { x: 3, y: 4 }];",
        "const sum = (p: Point): number => p.x + p.y;",
        "console.log('sum', pair.map(sum));",
        "throw new TypeError('typed failure');",
      ].join("\n"),
    });
    await run(page);
    await expectStatus(page, "failed");
    await expect(consoleOutput(page)).toContainText("sum [ 3, 7 ]");
    const error = consoleOutput(page).locator('[data-kind="runtime-error"]');
    await expect(error).toContainText("Uncaught TypeError: typed failure");
    await expect(
      error.getByRole("button", { name: /main\.ts line 7/ }),
    ).toBeVisible();
  });

  test("top-level await and timers complete the run", async ({ page }) => {
    await openPlayground(page, {
      code: "await new Promise((r) => setTimeout(r, 100));\nconsole.log('awaited');\nsetTimeout(() => console.log('timer done'), 200);",
    });
    await run(page);
    await expect(status(page)).toHaveAttribute("data-status", "running");
    await expectStatus(page, "completed");
    await expect(consoleOutput(page)).toContainText("awaited");
    await expect(consoleOutput(page)).toContainText("timer done");
  });

  test("an infinite loop is terminated by the timeout", async ({ page }) => {
    await openPlayground(page, {
      code: "console.log('start');\nwhile (true) {}",
      settings: { timeoutMs: 2_000 },
    });
    await run(page);
    await expect(consoleOutput(page)).toContainText("start");
    await expectStatus(page, "timed-out", 10_000);
    await expect(consoleOutput(page)).toContainText("timed out after 2.00 s");
    // The app is still responsive and can run again.
    await setCode(page, "console.log('alive')");
    await run(page);
    await expectStatus(page, "completed");
    await expect(consoleOutput(page)).toContainText("alive");
  });

  test("Stop terminates the active run", async ({ page }) => {
    await openPlayground(page, {
      code: "while (true) {}",
      settings: { timeoutMs: 30_000 },
    });
    await run(page);
    await expectStatus(page, "running");
    // Wait until the code is executing (not still compiling) before stopping.
    await expect(
      page.locator('iframe[title="Code execution sandbox"]'),
    ).toHaveCount(1);
    await page.waitForTimeout(300);
    await page.getByTestId("stop-button").click();
    await expectStatus(page, "stopped");
    await expect(consoleOutput(page)).toContainText("Execution stopped.");
    await expect(
      page.locator('iframe[title="Code execution sandbox"]'),
    ).toHaveCount(0);
  });

  test("output from an old run never appears in a newer run", async ({
    page,
  }) => {
    await openPlayground(page, {
      code: "setTimeout(() => console.log('STALE OUTPUT'), 1500);\nconsole.log('first run');",
      settings: { timeoutMs: 10_000 },
    });
    await run(page);
    await expect(consoleOutput(page)).toContainText("first run");
    await setCode(page, "console.log('second run');");
    await run(page);
    await expectStatus(page, "completed");
    await page.waitForTimeout(2_000);
    await expect(consoleOutput(page)).toContainText("second run");
    await expect(consoleOutput(page)).not.toContainText("STALE OUTPUT");
    await expect(consoleOutput(page)).not.toContainText("first run");
  });

  test("circular and unusual values do not crash the console", async ({
    page,
  }) => {
    await openPlayground(page, {
      code: [
        "const a = { name: 'a' }; a.self = a;",
        "console.log(a);",
        "console.log(Symbol('s'), 10n, undefined, null, new Map([[1, { a }]]), () => 1);",
        "console.log(new Proxy({}, { ownKeys() { throw new Error('trap'); } }));",
        "console.log('<b>not html</b>');",
      ].join("\n"),
    });
    await run(page);
    await expectStatus(page, "completed");
    const output = consoleOutput(page);
    await expect(output).toContainText("{ name: 'a', self: [Circular] }");
    await expect(output).toContainText("Symbol(s) 10n undefined null Map(1)");
    await expect(output).toContainText("[Uninspectable]");
    await expect(output).toContainText("<b>not html</b>");
    await expect(output.locator("b")).toHaveCount(0);
  });

  test("very large output is capped", async ({ page }) => {
    await openPlayground(page, {
      code: "for (let i = 0; i < 100000; i++) console.log('line', i);",
    });
    await run(page);
    await expectStatus(page, "failed");
    await expect(consoleOutput(page)).toContainText(
      "Output limit reached (1000 messages)",
    );
    const rows = await consoleOutput(page).locator('[data-kind="log"]').count();
    expect(rows).toBeLessThanOrEqual(1000);
  });

  test("the sandbox cannot reach the network or the app", async ({ page }) => {
    await openPlayground(page, {
      code: [
        "try { await fetch('/'); console.log('fetch allowed'); } catch (e) { console.log('fetch blocked', e.name); }",
        "console.log('origin', self.origin);",
        "console.log('document', typeof document);",
      ].join("\n"),
    });
    await run(page);
    await expectStatus(page, "completed");
    const output = consoleOutput(page);
    await expect(output).toContainText("fetch blocked TypeError");
    await expect(output).toContainText("origin null");
    await expect(output).toContainText("document undefined");
  });
});
