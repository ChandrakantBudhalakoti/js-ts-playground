import { expect, type Page } from "@playwright/test";
import type { EditorSettings, Language } from "../../src/types/playground";

interface OpenOptions {
  code?: string;
  language?: Language;
  settings?: Partial<EditorSettings>;
  /** Hash fragment to open, e.g. a share link. */
  hash?: string;
}

/** Open the playground with a seeded draft/settings and wait until it is interactive. */
export async function openPlayground(page: Page, options: OpenOptions = {}) {
  await page.addInitScript(
    ({ draft, settings }) => {
      if (draft)
        window.localStorage.setItem(
          "jsts-playground:draft",
          JSON.stringify(draft),
        );
      if (settings)
        window.localStorage.setItem(
          "jsts-playground:settings",
          JSON.stringify(settings),
        );
    },
    {
      draft:
        options.code !== undefined
          ? { language: options.language ?? "javascript", code: options.code }
          : null,
      settings: options.settings ? { ...options.settings } : null,
    },
  );
  await page.goto(`/${options.hash ? `#${options.hash}` : ""}`);
  await expect(page.locator(".monaco-editor").first()).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByTestId("compiler-status")).toHaveAttribute(
    "data-status",
    "ready",
    { timeout: 45_000 },
  );
}

/** Replace the editor contents as if pasted. */
export async function setCode(page: Page, code: string) {
  await page.locator(".monaco-editor .view-lines").first().click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Delete");
  if (code) await page.keyboard.insertText(code);
}

export async function run(page: Page) {
  await page.getByTestId("run-button").click();
}

export function status(page: Page) {
  return page.getByTestId("execution-status");
}

export function consoleOutput(page: Page) {
  return page.getByTestId("console-output");
}

export async function expectStatus(
  page: Page,
  value: string,
  timeout = 15_000,
) {
  await expect(status(page)).toHaveAttribute("data-status", value, { timeout });
}
