import { expect, test, type Locator, type Page } from "@playwright/test";
import type * as Monaco from "monaco-editor";
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

/**
 * A finger, through the DevTools protocol: real touch and pointer events,
 * held for as long as a test needs (Playwright itself only taps).
 */
async function finger(page: Page) {
  const client = await page.context().newCDPSession(page);
  const send = (
    type: "touchStart" | "touchMove" | "touchEnd",
    touchPoints: { x: number; y: number }[],
  ) => client.send("Input.dispatchTouchEvent", { type, touchPoints });
  return {
    down: (x: number, y: number) => send("touchStart", [{ x, y }]),
    move: (x: number, y: number) => send("touchMove", [{ x, y }]),
    up: () => send("touchEnd", []),
  };
}

async function centerOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, String(locator)).not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

/** The middle of a character of the code, on the screen. */
function pointAt(page: Page, lineNumber: number, column: number) {
  return page.evaluate(
    ([lineNumber, column]) => {
      const { monaco } = window as unknown as { monaco: typeof Monaco };
      const [editor] = monaco.editor.getEditors();
      const rect = editor.getDomNode()!.getBoundingClientRect();
      const at = (column: number) =>
        editor.getScrolledVisiblePosition({ lineNumber, column })!;
      const { left, top, height } = at(column);
      return {
        x: rect.left + (left + at(column + 1).left) / 2,
        y: rect.top + top + height / 2,
        lineHeight: height,
      };
    },
    [lineNumber, column],
  );
}

/** The editor's whole text and its selected part. */
function editorText(page: Page) {
  return page.evaluate(() => {
    const { monaco } = window as unknown as { monaco: typeof Monaco };
    const [editor] = monaco.editor.getEditors();
    const model = editor.getModel()!;
    return {
      value: model.getValue(),
      selected: model.getValueInRange(editor.getSelection()!),
    };
  });
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

  test("fits a 360 px phone, offline badge included", async ({
    page,
    context,
  }) => {
    test.skip(isTablet(), "phones only");
    await page.setViewportSize({ width: 360, height: 740 });
    await openPlayground(page, { language: "python", code: "print(1)" });
    await context.setOffline(true);
    await expect(page.getByTestId("offline-indicator")).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await expect(page.getByTestId("run-button")).toBeInViewport();
    await expect(page.getByTestId("code-keys")).toBeInViewport();
    await expect(page.getByRole("tab", { name: /Console/ })).toBeInViewport();
    await context.setOffline(false);

    // In Hindi too, chosen from the overflow menu (phones have no room for
    // the language button).
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitemradio", { name: "हिन्दी" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await expect(page.getByTestId("run-button")).toBeInViewport();
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

  test("a long press selects code; handles and the menu copy, cut and paste", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const clipboard = { text: "" };
      Object.assign(window, { __clipboard: clipboard });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            clipboard.text = text;
          },
          readText: async () => clipboard.text,
        },
      });
    });
    const code = "const greeting = 'hello';\nconsole.log(greeting);\n";
    await openPlayground(page, { code });
    const touch = await finger(page);
    const menu = page.getByTestId("selection-menu");
    const endHandle = page.getByTestId("selection-handle-end");
    const selected = async () => (await editorText(page)).selected;

    // Holding a finger on a word selects it; lifting it shows the menu.
    const word = await pointAt(page, 1, 9); // const gr|eeting
    await touch.down(word.x, word.y);
    await expect(endHandle).toBeVisible();
    await expect(menu).toBeHidden();
    await touch.up();
    await expect(menu).toBeVisible();
    await expect.poll(selected).toBe("greeting");

    // The end handle extends the selection to the end of the next line.
    const handle = await centerOf(endHandle);
    const { lineHeight } = word;
    await touch.down(handle.x, handle.y);
    await touch.move(handle.x, handle.y + lineHeight / 2);
    await touch.move(page.viewportSize()!.width - 4, handle.y + lineHeight);
    await touch.up();
    const lines = "greeting = 'hello';\nconsole.log(greeting);";
    await expect.poll(selected).toBe(lines);

    await menu.getByRole("button", { name: "Copy" }).click();
    await expect(menu.getByRole("button", { name: "Copied" })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __clipboard: { text: string } }).__clipboard
              .text,
        ),
      )
      .toBe(lines);

    // Cut removes it; a long press past the end of the line pastes it back.
    await menu.getByRole("button", { name: "Cut" }).click();
    await expect
      .poll(async () => (await editorText(page)).value)
      .toBe("const \n");
    await expect(menu).toBeHidden();
    const editor = (await page
      .locator(".monaco-editor")
      .first()
      .boundingBox())!;
    await touch.down(editor.x + editor.width - 24, word.y);
    await page.waitForTimeout(800); // a long press (nothing to see until it ends)
    await touch.up();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("button", { name: "Copy" })).toHaveCount(0);
    await menu.getByRole("button", { name: "Paste" }).click();
    await expect.poll(async () => (await editorText(page)).value).toBe(code);

    // Moving the finger after a long press extends the selection, word first.
    const log = await pointAt(page, 2, 10); // console.l|og
    await touch.down(log.x, log.y);
    await expect(endHandle).toBeVisible();
    await touch.move((await pointAt(page, 2, 1)).x - 4, log.y);
    await touch.up();
    await expect.poll(selected).toBe("console.log");

    // A tap elsewhere ends the selection.
    await page.waitForTimeout(500); // not a double tap
    await touch.down(word.x, word.y);
    await touch.up();
    await expect(menu).toBeHidden();
    await expect(endHandle).toBeHidden();
    await expect.poll(selected).toBe("");

    // A tap on a line number selects the line, with the same handles and menu.
    const lineNumber = await centerOf(
      page.locator(".monaco-editor .line-numbers", { hasText: /^2$/ }),
    );
    await touch.down(lineNumber.x, lineNumber.y);
    await touch.up();
    await expect.poll(selected).toBe("console.log(greeting);\n");
    await expect(menu).toBeVisible();
    await expect(endHandle).toBeVisible();
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
