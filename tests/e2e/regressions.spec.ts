import { expect, test, type Page } from "@playwright/test";
import { encodeShareHash } from "../../src/lib/sharing/encode-code";
import {
  answerDialog,
  consoleOutput,
  expectStatus,
  openPlayground,
  run,
  setCode,
} from "./helpers";

const editorLines = (page: Page) => page.locator(".monaco-editor .view-lines");

async function focusEditorEnd(page: Page) {
  await editorLines(page).first().click();
  await page.keyboard.press("ControlOrMeta+End");
}

test.describe("regressions", () => {
  test("Run uses the saved document while the editor is still loading", async ({
    page,
  }) => {
    // Hold Monaco back so the editor is not mounted when Run is pressed.
    await page.route("**/vendor/monaco/**/loader.js", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      await route.continue();
    });
    await page.addInitScript(() =>
      window.localStorage.setItem(
        "jsts-playground:draft",
        JSON.stringify({
          language: "javascript",
          code: "console.log('ran before Monaco loaded')",
        }),
      ),
    );
    await page.goto("/playground");
    await expect(page.getByTestId("compiler-status")).toHaveAttribute(
      "data-status",
      "ready",
      { timeout: 45_000 },
    );
    await expect(page.locator(".monaco-editor")).toHaveCount(0);
    await run(page);
    await expectStatus(page, "completed");
    await expect(consoleOutput(page)).toContainText("ran before Monaco loaded");
    await expect(consoleOutput(page)).not.toContainText("Nothing to run");
  });

  test("console calls with more than 50 arguments are shown, not dropped", async ({
    page,
  }) => {
    await openPlayground(page, {
      code: "console.log(...Array.from({ length: 60 }, (_, i) => i));",
    });
    await run(page);
    await expectStatus(page, "completed");
    await expect(consoleOutput(page)).toContainText(
      "47 48 … 11 more arguments",
    );
  });

  test("errors passed to console.error show source positions, not blob URLs", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "typescript",
      code: [
        "type Shape = { kind: string };",
        "",
        "function fail(shape: Shape): never {",
        "  throw new Error('caught ' + shape.kind);",
        "}",
        "try { fail({ kind: 'box' }); } catch (error) { console.error(error); }",
      ].join("\n"),
    });
    await run(page);
    await expectStatus(page, "completed");
    const logged = consoleOutput(page).locator('[data-kind="log"]');
    await expect(logged).toContainText("Error: caught box");
    await expect(logged).toContainText("main.ts:4:");
    await expect(logged).not.toContainText("blob:");
  });

  test("replacing code across languages can be undone in the editor", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "typescript",
      code: "const mine: number = 1;",
    });
    await page.getByRole("button", { name: "Examples" }).click();
    await page.getByRole("menuitem", { name: /JavaScript basics/ }).click();
    await answerDialog(page, "Replace", "JavaScript basics");
    await expect(
      page.getByRole("radio", { name: "JavaScript" }),
    ).toHaveAttribute("data-state", "on");
    await expect(editorLines(page)).toContainText("Hello from");

    await editorLines(page).first().click();
    await page.keyboard.press("ControlOrMeta+Z");
    await expect(editorLines(page)).toContainText("const mine: number = 1;");
  });

  test("the Undo notification restores the replaced code and its language", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "typescript",
      code: "const mine: number = 2;",
    });
    await page.getByRole("button", { name: "Examples" }).click();
    await page.getByRole("menuitem", { name: /JavaScript basics/ }).click();
    await answerDialog(page, "Replace", "JavaScript basics");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(editorLines(page)).toContainText("const mine: number = 2;");
    await expect(
      page.getByRole("radio", { name: "TypeScript" }),
    ).toHaveAttribute("data-state", "on");
  });

  test("a share link pasted into the address bar asks before replacing work", async ({
    page,
  }) => {
    await openPlayground(page, { code: "console.log('my work');" });
    const hash = await encodeShareHash({
      language: "javascript",
      code: "console.log('from a link');",
    });

    await page.evaluate((value) => (window.location.hash = value), hash);
    await answerDialog(page, "Cancel", "Open the shared code?");
    await expect(editorLines(page)).toContainText("console.log('my work');");
    expect(new URL(page.url()).hash).toBe("");

    // Decoding the link is async: wait for the *new* dialog, not the old one.
    await page.evaluate((value) => (window.location.hash = value), hash);
    await answerDialog(page, "Replace", "Open the shared code?");
    await expect(editorLines(page)).toContainText(
      "console.log('from a link');",
    );
    // The user's work is one click away.
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(editorLines(page)).toContainText("console.log('my work');");
  });

  test("a finished run's sandbox is destroyed shortly after completion", async ({
    page,
  }) => {
    await openPlayground(page, { code: "console.log('done');" });
    await run(page);
    await expectStatus(page, "completed");
    // Nothing from this run may keep executing in the background.
    await expect(
      page.locator('iframe[title="Code execution sandbox"]'),
    ).toHaveCount(0, { timeout: 3_000 });
  });

  test("oversized code is reported as too large instead of timing out", async ({
    page,
  }) => {
    await openPlayground(page, {
      code: `// ${"x".repeat(1_050_000)}\nconsole.log('never runs');`,
      settings: { timeoutMs: 30_000 },
    });
    await run(page);
    await expectStatus(page, "failed", 20_000);
    await expect(consoleOutput(page)).toContainText("too large to run");
    await expect(consoleOutput(page)).not.toContainText("timed out");
  });

  test("crossing the mobile breakpoint keeps the same editor and its undo history", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openPlayground(page, { code: "const a = 1;" });
    await page.evaluate(() => {
      (document.querySelector(".monaco-editor") as HTMLElement).dataset.probe =
        "original";
    });
    await focusEditorEnd(page);
    await page.keyboard.type(" // edited");

    await page.setViewportSize({ width: 480, height: 800 });
    await expect(page.getByRole("tab", { name: "Code" })).toBeVisible();
    await expect(
      page.locator('.monaco-editor[data-probe="original"]'),
    ).toHaveCount(1);
    await expect(editorLines(page)).toContainText("const a = 1; // edited");

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(
      page.locator('.monaco-editor[data-probe="original"]'),
    ).toHaveCount(1);
    await editorLines(page).first().click();
    await page.keyboard.press("ControlOrMeta+Z");
    await expect(editorLines(page)).not.toContainText("// edited");
  });

  test("edits made right before a reload are saved", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 45_000,
    });
    await setCode(page, "console.log('typed just before reload');");
    await page.reload(); // well within the 400 ms autosave delay
    await expect(editorLines(page)).toContainText("typed just before reload", {
      timeout: 45_000,
    });
  });

  test("runtime error links keep the file of the run after switching language", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "typescript",
      code: "const n: number = 1;\nthrow new Error('boom ' + n);",
    });
    await run(page);
    await expectStatus(page, "failed");
    const link = consoleOutput(page).getByRole("button", {
      name: /Go to main\.ts/,
    });
    await expect(link).toHaveText(/^main\.ts:2:/);
    await page.getByRole("radio", { name: "JavaScript" }).click();
    await expect(link).toHaveText(/^main\.ts:2:/);
  });
});
