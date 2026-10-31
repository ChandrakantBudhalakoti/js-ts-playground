import { expect, test, type Page } from "@playwright/test";
import {
  consoleOutput,
  expectStatus,
  openPlayground,
  run,
  selectLanguage,
} from "./helpers";

/**
 * Offline use on a phone: the service worker saves the app and each
 * language runtime the first time they are used, and everything used once
 * keeps working without a connection. Runs in the mobile and tablet
 * projects (playwright.config.ts), with service workers allowed.
 */
test.use({ serviceWorkers: "allow" });
test.describe.configure({ timeout: 240_000 });

const isTablet = () => test.info().project.name === "tablet";

/** Show the console (phones show one panel at a time). */
async function showConsole(page: Page) {
  if (!isTablet()) await page.getByRole("tab", { name: /Console/ }).click();
}

async function controlledAndSaved(page: Page, runtime: string) {
  await expect
    .poll(
      () =>
        page.evaluate(async (id) => {
          if (!navigator.serviceWorker.controller) return false;
          const names = await caches.keys();
          const name = names.find((n) =>
            n.startsWith(`codetakhti-runtime-${id}-`),
          );
          if (!name) return false;
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return keys.some((request) => request.url.endsWith("__downloaded__"));
        }, runtime),
      { timeout: 120_000 },
    )
    .toBe(true);
}

test("asks before a download, then runs offline what was used once", async ({
  page,
  context,
}) => {
  await openPlayground(page, {
    language: "python",
    code: "print('hello offline')",
    settings: { askBeforeDownload: true },
    ready: false,
  });

  // The first run of Python needs its runtime: the size is shown first.
  await run(page);
  const prompt = page.getByTestId("download-prompt");
  await expect(prompt).toContainText("Python needs a one-time 7 MB download");
  await prompt.getByRole("button", { name: "Cancel" }).click();
  await expect(prompt).toBeHidden();
  await run(page);
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Download" }).click();
  await expect(page.getByTestId("compiler-status")).toHaveAttribute(
    "data-status",
    "ready",
    { timeout: 120_000 },
  );
  await run(page);
  await expectStatus(page, "completed", 60_000);
  await expect(consoleOutput(page)).toContainText("hello offline");
  await controlledAndSaved(page, "python");

  // Settings lists it, with its size.
  await page.getByRole("button", { name: "Settings" }).click();
  const saved = page.getByTestId("downloaded-languages");
  await expect(saved).toContainText("Python");
  await expect(saved).toContainText("MB");
  await page.keyboard.press("Escape");

  // Offline: the page reloads from the cache and Python still runs.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("offline-indicator")).toBeVisible();
  await expect(page.getByTestId("compiler-status")).toHaveAttribute(
    "data-status",
    "ready",
    { timeout: 60_000 },
  );
  await run(page);
  await expectStatus(page, "completed", 60_000);
  await showConsole(page);
  await expect(consoleOutput(page)).toContainText("hello offline");

  // A language never downloaded explains that it needs internet once.
  await selectLanguage(page, "Ruby");
  await run(page);
  await expect(page.getByTestId("download-prompt")).toContainText(
    "You're offline. Ruby needs internet once.",
  );

  await context.setOffline(false);
});
