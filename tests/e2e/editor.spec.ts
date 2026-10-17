import { expect, test } from "@playwright/test";
import {
  answerDialog,
  consoleOutput,
  expectStatus,
  openPlayground,
  run,
  setCode,
} from "./helpers";

test.describe("editor and diagnostics", () => {
  test("semantic type errors appear in Problems and as markers, and click navigates", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "typescript",
      code: "// demo\n\nconst age: number = '25';\n",
    });
    await page.getByRole("tab", { name: /Problems/ }).click();
    const problem = page.getByTestId("problem-item");
    await expect(problem).toHaveCount(1);
    await expect(problem).toContainText(
      "Type 'string' is not assignable to type 'number'.",
    );
    await expect(problem).toContainText("main.ts:3:7");
    await expect(page.locator(".monaco-editor .squiggly-error")).toHaveCount(1);

    // Clicking focuses the editor at line 3, column 7: typing lands right before "age".
    await problem.click();
    await page.keyboard.type("X");
    await expect(
      page.locator(".monaco-editor .view-line").nth(2),
    ).toContainText("const Xage");
  });

  test("type errors do not block running by default", async ({ page }) => {
    await openPlayground(page, {
      language: "typescript",
      code: "const age: number = '25' as any as number;\nconst n: number = 'x';\nconsole.log('ran');",
    });
    await run(page);
    await expectStatus(page, "completed");
    await expect(consoleOutput(page)).toContainText(
      "Running with 1 type error",
    );
    await expect(consoleOutput(page)).toContainText("ran");
  });

  test("syntax errors produce a diagnostic and block the run", async ({
    page,
  }) => {
    await openPlayground(page, { code: "console.log('ok');\nconst x = ;\n" });
    await run(page);
    await expectStatus(page, "failed");
    await expect(page.getByRole("tab", { name: /Problems/ })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(page.getByTestId("problem-item")).toContainText(
      "Expression expected.",
    );
    await expect(page.getByTestId("problem-item")).toContainText(
      "main.js:2:11",
    );
    await page.getByRole("tab", { name: /Console/ }).click();
    await expect(consoleOutput(page)).toContainText(
      "Fix 1 syntax error before running.",
    );
  });

  test("autocomplete suggests members of a local object", async ({ page }) => {
    await openPlayground(page, { language: "typescript", code: "" });
    await setCode(page, "const user = { name: 'Alex', age: 30 };\nuser");
    await page.keyboard.type(".");
    const suggest = page.locator(".monaco-editor .suggest-widget");
    await expect(suggest).toBeVisible();
    await expect(
      suggest.locator(".monaco-list-row", { hasText: "name" }),
    ).toBeVisible();
    await expect(
      suggest.locator(".monaco-list-row", { hasText: "age" }),
    ).toBeVisible();
  });

  test("hover shows type information", async ({ page }) => {
    await openPlayground(page, {
      language: "typescript",
      code: "const total = [1, 2, 3].reduce((a, b) => a + b, 0);\ntotal;\n",
    });
    // Line 2 contains only the identifier, so hovering it is unambiguous.
    await page
      .locator(".monaco-editor .view-line", { hasText: /^total;$/ })
      .locator("span")
      .first()
      .hover();
    await expect(page.locator(".monaco-hover:not(.hidden)")).toContainText(
      "const total: number",
    );
  });

  test("switching language keeps edited code and re-checks it", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "javascript",
      code: "const age = 1;\nconsole.log(age);\n",
    });
    await page.getByRole("radio", { name: "TypeScript" }).click();
    await expect(
      page.getByRole("radio", { name: "TypeScript" }),
    ).toHaveAttribute("data-state", "on");
    await expect(
      page.locator(".monaco-editor .view-line").first(),
    ).toContainText("const age = 1;");
    await setCode(page, "const age: number = 1;\nconsole.log(age);");
    await run(page);
    await expectStatus(page, "completed");
  });

  test("Reset restores the starter example after confirmation", async ({
    page,
  }) => {
    await openPlayground(page, {
      language: "javascript",
      code: "console.log('my work');",
    });
    await page.getByRole("button", { name: "Reset" }).click();
    await answerDialog(page, "Cancel", "Reset the editor?");
    await expect(
      page.locator(".monaco-editor .view-line").first(),
    ).toContainText("my work");
    await page.getByRole("button", { name: "Reset" }).click();
    await answerDialog(page, "Replace", "Reset the editor?");
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      'const language = "JavaScript";',
    );
  });

  test("examples load with their language", async ({ page }) => {
    await openPlayground(page);
    await page.getByRole("button", { name: "Examples" }).click();
    await page.getByRole("menuitem", { name: /Type errors/ }).click();
    await expect(
      page.getByRole("radio", { name: "TypeScript" }),
    ).toHaveAttribute("data-state", "on");
    await page.getByRole("tab", { name: /Problems/ }).click();
    await expect(page.getByTestId("problem-item").first()).toContainText(
      "is not assignable",
    );
  });

  test("Format applies Prettier and reports failures", async ({ page }) => {
    await openPlayground(page, {
      code: "const   x={a:1,b:[1,2]};console.log( x )",
    });
    await page.getByRole("button", { name: "Format" }).click();
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "const x = { a: 1, b: [1, 2] };",
    );
    await setCode(page, "const = ;");
    await page.getByRole("button", { name: "Format" }).click();
    await expect(page.getByText("Could not format the code")).toBeVisible();
  });

  test("empty code is handled gracefully", async ({ page }) => {
    await openPlayground(page, { code: "" });
    await run(page);
    await expect(consoleOutput(page)).toContainText("Nothing to run");
  });

  test("Ctrl+Enter runs from the editor", async ({ page }) => {
    await openPlayground(page, { code: "console.log('shortcut')" });
    await page.locator(".monaco-editor .view-lines").first().click();
    await page.keyboard.press("ControlOrMeta+Enter");
    await expectStatus(page, "completed");
    await expect(consoleOutput(page)).toContainText("shortcut");
  });
});

test.describe("sharing and persistence", () => {
  test("share link round-trips code and language", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openPlayground(page, {
      language: "typescript",
      code: "const shared: string = 'hi';\nconsole.log(shared);",
    });
    await page.getByRole("button", { name: "Share" }).click();
    await expect(
      page.getByText("Share link copied to clipboard"),
    ).toBeVisible();
    const url = page.url();
    expect(url).toContain("#lang=ts&code=");

    const other = await context.newPage();
    await other.goto(url);
    await expect(other.locator(".monaco-editor .view-lines")).toContainText(
      "const shared: string = 'hi';",
    );
    await expect(
      other.getByRole("radio", { name: "TypeScript" }),
    ).toHaveAttribute("data-state", "on");
  });

  test("a malformed share link falls back gracefully", async ({ page }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem(
        "jsts-playground:draft",
        JSON.stringify({
          language: "javascript",
          code: "console.log('draft')",
        }),
      ),
    );
    await page.goto("/playground#lang=js&code=@@not-valid@@");
    await expect(
      page.getByText("The share link contains invalid characters."),
    ).toBeVisible();
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "console.log('draft')",
      {
        timeout: 45_000,
      },
    );
    expect(new URL(page.url()).hash).toBe("");
  });

  test("the draft survives a reload", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 45_000,
    });
    await setCode(page, "console.log('persisted draft');");
    await page.waitForTimeout(800);
    await page.reload();
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "persisted draft",
      { timeout: 45_000 },
    );
  });
});
