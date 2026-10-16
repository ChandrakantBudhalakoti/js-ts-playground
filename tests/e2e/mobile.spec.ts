import { expect, test } from "@playwright/test";
import { consoleOutput, expectStatus, openPlayground, run } from "./helpers";

test.describe("mobile layout", () => {
  test("has no horizontal overflow and keeps Run reachable", async ({
    page,
  }) => {
    await openPlayground(page, { code: "console.log('from mobile')" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByTestId("run-button")).toBeInViewport();
    await expect(
      page.getByRole("radio", { name: "TypeScript" }),
    ).toBeInViewport();

    await run(page);
    await expectStatus(page, "completed");
    // Running switches to the console tab.
    await expect(page.getByRole("tab", { name: /Console/ })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(consoleOutput(page)).toContainText("from mobile");

    await page.getByRole("tab", { name: "Code" }).click();
    await expect(page.locator(".monaco-editor").first()).toBeVisible();
    const overflowAfter = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflowAfter).toBeLessThanOrEqual(0);
  });

  test("secondary actions are in the overflow menu", async ({ page }) => {
    await openPlayground(page, { code: "const  a=1" });
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Format" }).click();
    await expect(page.locator(".monaco-editor .view-lines")).toContainText(
      "const a = 1;",
    );
  });
});
