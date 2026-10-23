import { expect, test } from "@playwright/test";
import { EXAMPLES } from "../../src/lib/examples";
import { GUIDES } from "../../src/lib/guides";
import { languageInfo } from "../../src/lib/languages";
import {
  expectStatus,
  loggedLines,
  openPlayground,
  run,
  setCode,
  waitForPlayground,
} from "./helpers";

test.describe("example guides", () => {
  for (const guide of GUIDES) {
    test(`"${guide.heading}" opens in the playground and prints the output shown on the page`, async ({
      page,
    }) => {
      await page.goto(`/examples/${guide.slug}`);
      await page
        .getByRole("link", { name: "Open in the playground" })
        .first()
        .click();
      await expect(page).toHaveURL(
        new RegExp(`/playground\\?example=${guide.exampleId}$`),
      );
      // The notification is short-lived: check it before the editor loads.
      await expect(page.getByText(/^Opened “/)).toBeVisible();
      await waitForPlayground(page);
      await run(page);
      await expectStatus(page, "completed");
      await expect(loggedLines(page)).toHaveText(guide.output);
    });
  }
});

test.describe("opening examples by URL", () => {
  for (const example of EXAMPLES) {
    test(`?example=${example.id} loads its code and language`, async ({
      page,
    }) => {
      await openPlayground(page, { query: `example=${example.id}` });
      await expect(page.getByTestId("language-select")).toHaveAccessibleName(
        `Language: ${languageInfo(example.language).name}`,
      );
      const firstLine = example.code.split("\n")[0];
      await expect(
        page.locator(".monaco-editor .view-line").first(),
      ).toContainText(firstLine);
    });
  }

  test("the URL is cleared once the example is edited, and the draft can be restored", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem(
        "jsts-playground:draft",
        JSON.stringify({
          language: "javascript",
          code: "console.log('my draft');",
        }),
      ),
    );
    await page.goto("/playground?example=js-promises");
    // Use the notification's action while it is showing, editor loaded or not.
    await expect(page.getByText("Opened “Promises”")).toBeVisible();
    expect(new URL(page.url()).search).toBe("?example=js-promises");
    await page.getByRole("button", { name: "Restore draft" }).click();
    await waitForPlayground(page);
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "my draft",
    );
    expect(new URL(page.url()).search).toBe("");

    // The example itself loads when the link is opened again.
    await page.goto("/playground?example=js-promises");
    await waitForPlayground(page);
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "const wait",
    );
  });

  test("editing the example removes ?example= so a reload keeps the edits", async ({
    page,
  }) => {
    await openPlayground(page, { query: "example=ts-generics" });
    await setCode(page, "console.log('edited example');");
    await expect.poll(() => new URL(page.url()).search).toBe("");
    await page.reload();
    await waitForPlayground(page);
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "edited example",
    );
  });

  test("an unknown example falls back to the draft with a message", async ({
    page,
  }) => {
    await openPlayground(page, {
      code: "console.log('kept draft');",
      query: "example=does-not-exist",
    });
    await expect(page.getByText("That example does not exist.")).toBeVisible();
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "kept draft",
    );
    expect(new URL(page.url()).search).toBe("");
  });

  test("sharing an opened example creates a link without ?example=", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openPlayground(page, { query: "example=js-basics" });
    await page.getByRole("button", { name: "Share" }).click();
    await expect(
      page.getByText("Share link copied to clipboard"),
    ).toBeVisible();
    const url = new URL(page.url());
    expect(url.pathname).toBe("/playground");
    expect(url.search).toBe("");
    expect(url.hash).toMatch(/^#lang=js&code=/);
  });
});
