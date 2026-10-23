import { expect, test, type Page } from "@playwright/test";
import { LANGUAGES } from "../../src/lib/languages";
import {
  answerDialog,
  consoleOutput,
  expectLanguage,
  expectStatus,
  openPlayground,
  run,
} from "./helpers";

/**
 * Phones and tablets: the "mobile" project is a phone (Pixel 7), "tablet" an
 * iPad-sized touch screen. Both have a coarse pointer, like real devices.
 */
const isTablet = () => test.info().project.name === "tablet";

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
}

test.describe("phone and tablet layout", () => {
  test("has no horizontal overflow and keeps Run reachable", async ({
    page,
  }) => {
    await openPlayground(page, { code: "console.log('from mobile')" });
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await expect(page.getByTestId("run-button")).toBeInViewport();
    await expect(page.getByTestId("language-select")).toBeInViewport();

    await run(page);
    await expectStatus(page, "completed");
    await expect(page.getByRole("tab", { name: /Console/ })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(consoleOutput(page)).toContainText("from mobile");

    if (!isTablet()) {
      // Phones show one panel at a time: running switches to the console.
      await page.getByRole("tab", { name: "Code" }).click();
    }
    await expect(page.locator(".monaco-editor").first()).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test("controls are big enough to tap", async ({ page }) => {
    await openPlayground(page, { code: "console.log(1)" });
    const controls = [
      page.getByTestId("run-button"),
      page.getByTestId("language-select"),
      page.getByRole("button", { name: "Examples" }),
      page.getByRole("button", { name: "Settings" }),
      page.getByRole("tab", { name: /Console/ }),
      page.getByRole("tab", { name: /Problems/ }),
    ];
    for (const control of controls) {
      const box = await control.boundingBox();
      expect(box, String(control)).not.toBeNull();
      expect(box!.height, String(control)).toBeGreaterThanOrEqual(40);
      expect(box!.width, String(control)).toBeGreaterThanOrEqual(40);
    }
  });

  test("the Examples menu opens other languages' examples with taps", async ({
    page,
  }) => {
    await openPlayground(page, { language: "python", code: "print(1)" });
    await page.getByRole("button", { name: "Examples" }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeInViewport({ ratio: 1 });
    await menu.getByRole("menuitem", { name: "C examples" }).click();
    // The same panel now lists C's examples, with a way back.
    await expect(
      menu.getByRole("menuitem", { name: /All languages/ }),
    ).toBeVisible();
    await expect(menu).toBeInViewport({ ratio: 1 });
    await menu.getByRole("menuitem", { name: /Hello, C/ }).click();
    await answerDialog(page, "Replace", "Hello, C");
    await expectLanguage(page, "C");
    await expect(
      page.locator(".monaco-editor .view-line").first(),
    ).toContainText("#include <stdio.h>");
  });

  test("code keys type brackets, symbols and Tab into the editor", async ({
    page,
  }) => {
    await openPlayground(page, { code: "" });
    const keys = page.getByTestId("code-keys");
    await expect(keys).toBeVisible();
    await page.locator(".monaco-editor .view-lines").first().click();
    await keys.getByRole("button", { name: "(", exact: true }).click();
    // Auto-closing brackets work as with a keyboard: "(" inserts "()".
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "()",
    );
    await keys.getByRole("button", { name: '"', exact: true }).click();
    await keys.getByRole("button", { name: "Tab", exact: true }).click();
    await keys.getByRole("button", { name: ";", exact: true }).click();
    await expect(
      page.locator(".monaco-editor .view-lines").first(),
    ).toContainText(";");
    await keys.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(
      page.locator(".monaco-editor .view-lines").first(),
    ).not.toContainText(";");
  });

  test("long lines wrap by default on phones", async ({ page }) => {
    test.skip(isTablet(), "tablets have room for long lines");
    await openPlayground(page, { code: "console.log(1)" });
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page.getByRole("switch", { name: "Word wrap" })).toBeChecked();
  });

  test("Share opens the system share sheet", async ({ page }) => {
    await page.addInitScript(() => {
      const shared: ShareData[] = [];
      Object.assign(window, { __shared: shared });
      navigator.share = async (data?: ShareData) => {
        if (data) shared.push(data);
      };
    });
    await openPlayground(page, { language: "python", code: "print('hi')" });
    if (isTablet()) await page.getByRole("button", { name: "Share" }).click();
    else {
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Share" }).click();
    }
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __shared: ShareData[] }).__shared[0]?.url,
        ),
      )
      .toMatch(/\/playground#lang=py&code=/);
  });

  test("secondary actions are in the overflow menu", async ({ page }) => {
    test.skip(isTablet(), "tablets show them in the toolbar");
    await openPlayground(page, { code: "const  a=1" });
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Format" }).click();
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "const a = 1;",
    );
  });

  test("content pages fit the screen and link to the editor", async ({
    page,
  }) => {
    for (const path of [
      "/",
      "/languages",
      ...LANGUAGES.map((info) => info.path),
      "/examples",
      "/examples/typescript-generics",
    ]) {
      await page.goto(path);
      expect(await horizontalOverflow(page), path).toBeLessThanOrEqual(0);
      await expect(
        page.getByRole("navigation", { name: "Main" }),
        path,
      ).toBeVisible();
    }
    await page.goto("/");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Start Coding" })
      .first()
      .click();
    await expect(page.getByTestId("run-button")).toBeInViewport({
      timeout: 45_000,
    });
  });
});
