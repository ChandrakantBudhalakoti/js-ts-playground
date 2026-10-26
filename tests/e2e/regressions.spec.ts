import { expect, test, type Page } from "@playwright/test";
import { encodeShareHash } from "../../src/lib/sharing/encode-code";
import {
  answerDialog,
  consoleOutput,
  expectLanguage,
  expectStatus,
  openPlayground,
  run,
  selectLanguage,
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
    // Hold Monaco back until Run has been checked, so the editor is not
    // mounted when Run is pressed (however long the checker takes to load).
    let releaseMonaco = () => {};
    const monacoHeld = new Promise<void>(
      (resolve) => (releaseMonaco = resolve),
    );
    await page.route("**/vendor/monaco/**/loader.js", async (route) => {
      await monacoHeld;
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
    releaseMonaco();
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
    await expectLanguage(page, "JavaScript");
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
    await expectLanguage(page, "TypeScript");
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
    await selectLanguage(page, "JavaScript");
    await expect(link).toHaveText(/^main\.ts:2:/);
  });

  test("TypeScript recovers on Run after its download failed", async ({
    page,
  }) => {
    // As when an overloaded server refuses the connection.
    const libs = "**/vendor/typescript/**";
    await page.route(libs, (route) => route.abort("connectionrefused"));
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem(
          "jsts-playground:draft",
          JSON.stringify({
            language: "typescript",
            code: "console.log('back online');",
          }),
        );
      } catch {
        // the sandbox iframe has no storage
      }
    });
    await page.goto("/playground");
    const compiler = page.getByTestId("compiler-status");
    await expect(compiler).toHaveAttribute("data-status", "error", {
      timeout: 45_000,
    });

    await page.unroute(libs);
    await run(page);
    await expectStatus(page, "completed", 45_000);
    await expect(consoleOutput(page)).toContainText("back online");
    await expect(compiler).toHaveAttribute("data-status", "ready");
  });

  test("an opened share link replaces the saved draft only once it is edited", async ({
    page,
  }) => {
    await openPlayground(page, { code: "console.log('my work');" });
    const hash = await encodeShareHash({
      language: "javascript",
      code: "console.log('from a link');",
    });
    await page.evaluate((value) => (window.location.hash = value), hash);
    await answerDialog(page, "Replace", "Open the shared code?");
    await expect(editorLines(page)).toContainText("from a link");

    const savedCode = () =>
      page.evaluate(
        () =>
          JSON.parse(
            window.localStorage.getItem("jsts-playground:draft") ?? "{}",
          ).code as string,
      );
    await page.waitForTimeout(1_000); // past the 400 ms autosave delay
    expect(await savedCode()).toBe("console.log('my work');");

    await focusEditorEnd(page);
    await page.keyboard.type(" // mine now");
    await expect.poll(savedCode).toContain("// mine now");
  });
});

test.describe("download failures", () => {
  test("a page whose scripts fail to download says so and offers Reload", async ({
    page,
  }) => {
    // As when an overloaded server refuses connections: React never starts.
    const chunks = "**/_next/static/chunks/**";
    await page.route(chunks, (route) => route.abort("connectionrefused"));
    await page.goto("/playground");
    const notice = page.getByTestId("load-failure");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("didn't download");

    await page.unroute(chunks);
    await notice.getByRole("button", { name: "Reload" }).click();
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(notice).toHaveCount(0);
  });
});

test.describe("app Content Security Policy", () => {
  test("blocks inline event handlers injected into the page", async ({
    page,
  }) => {
    await openPlayground(page);
    const outcome = await page.evaluate(async () => {
      const violation = new Promise<string>((resolve) => {
        document.addEventListener(
          "securitypolicyviolation",
          (event) => resolve(event.effectiveDirective),
          { once: true },
        );
        setTimeout(() => resolve("none"), 5_000);
      });
      // What a sanitizer bypass in rendered markdown would look like.
      const host = document.createElement("div");
      host.innerHTML = '<img src="data:," onerror="window.__injected = true">';
      document.body.append(host);
      const directive = await violation;
      host.remove();
      return {
        directive,
        injected: (window as { __injected?: boolean }).__injected === true,
      };
    });
    expect(outcome).toEqual({ directive: "script-src-attr", injected: false });
  });
});
