import { expect, type Page } from "@playwright/test";
import type { EditorSettings, Language } from "../../src/types/playground";

interface OpenOptions {
  code?: string;
  language?: Language;
  settings?: Partial<EditorSettings>;
  /** Hash fragment to open, e.g. a share link. */
  hash?: string;
  /** Query string without the `?`, e.g. `example=ts-generics`. */
  query?: string;
}

/** Wait until the editor is mounted and the type checker is ready. */
export async function waitForPlayground(page: Page) {
  await expect(page.locator(".monaco-editor").first()).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByTestId("compiler-status")).toHaveAttribute(
    "data-status",
    "ready",
    { timeout: 45_000 },
  );
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
  const query = options.query ? `?${options.query}` : "";
  const hash = options.hash ? `#${options.hash}` : "";
  await page.goto(`/playground${query}${hash}`);
  await waitForPlayground(page);
}

/** The text of each line the user's code logged (system notes excluded). */
export function loggedLines(page: Page) {
  return page.locator('[data-testid="console-output"] [data-kind="log"] pre');
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

/**
 * Answer the confirmation dialog that is currently open. A dismissed dialog
 * stays in the DOM while its close animation runs, so a plain
 * `getByRole("button", { name: "Replace" })` can hit that dying dialog (a
 * no-op) instead of a newly opened one. Match only the open dialog, then wait
 * until it has fully closed before continuing.
 */
export async function answerDialog(
  page: Page,
  button: "Replace" | "Cancel",
  title?: string,
) {
  const dialog = page.locator('[role="alertdialog"][data-state="open"]');
  await expect(dialog).toBeVisible();
  if (title) await expect(dialog).toContainText(title);
  await dialog.getByRole("button", { name: button }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
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
