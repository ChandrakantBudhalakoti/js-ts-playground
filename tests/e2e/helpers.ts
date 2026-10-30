import { expect, type Page } from "@playwright/test";
import type { EditorSettings, Language } from "../../src/types/playground";

interface OpenOptions {
  code?: string;
  language?: Language;
  /** Standard input saved with the draft. */
  stdin?: string;
  settings?: Partial<EditorSettings>;
  /** Hash fragment to open, e.g. a share link. */
  hash?: string;
  /** Query string without the `?`, e.g. `example=ts-generics`. */
  query?: string;
  /** Wait until the language's tooling is ready (default true). */
  ready?: boolean;
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
      // Merged into what is stored, so settings changed in a test survive
      // a reload. Languages download without asking first unless a test
      // asks for the prompt.
      const key = "jsts-playground:settings";
      const stored = JSON.parse(window.localStorage.getItem(key) ?? "{}");
      window.localStorage.setItem(
        key,
        JSON.stringify({ askBeforeDownload: false, ...stored, ...settings }),
      );
    },
    {
      draft:
        options.code !== undefined
          ? {
              language: options.language ?? "javascript",
              code: options.code,
              ...(options.stdin ? { stdin: options.stdin } : {}),
            }
          : null,
      settings: options.settings ?? {},
    },
  );
  const query = options.query ? `?${options.query}` : "";
  const hash = options.hash ? `#${options.hash}` : "";
  await page.goto(`/playground${query}${hash}`);
  if (options.ready === false) {
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 45_000,
    });
  } else {
    await waitForPlayground(page);
  }
}

/** The language picker is labelled "Language: <name>". */
export async function expectLanguage(page: Page, name: string) {
  await expect(page.getByTestId("language-select")).toHaveAccessibleName(
    `Language: ${name}`,
  );
}

export async function selectLanguage(page: Page, name: string) {
  await page.getByTestId("language-select").click();
  await page.getByRole("option", { name, exact: true }).click();
  await expectLanguage(page, name);
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
