import { expect, test } from "@playwright/test";
import {
  consoleOutput,
  expectStatus,
  openPlayground,
  run,
  status,
  waitForPlayground,
} from "./helpers";

/**
 * The interface in Hindi and Hinglish, and friendly explanations of errors.
 * Program output is never translated.
 */
test.describe("interface language", () => {
  test("the हिं / EN toggle switches to Hindi, Settings has Hinglish, and it is remembered", async ({
    page,
  }) => {
    await openPlayground(page, { code: "console.log('नमस्ते, Ada');" });
    await page.getByRole("button", { name: "हिं (Switch to Hindi)" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.getByRole("button", { name: "उदाहरण" })).toBeVisible();

    await run(page);
    await expectStatus(page, "completed");
    await expect(status(page)).toContainText("पूरा हुआ");
    await expect(consoleOutput(page)).toContainText("नमस्ते, Ada");

    // The choice survives a reload.
    await page.reload();
    await waitForPlayground(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.getByRole("button", { name: "उदाहरण" })).toBeVisible();

    // Hinglish, from Settings.
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("combobox", { name: "App की भाषा" }).click();
    await page.getByRole("option", { name: "Hinglish" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "hi-Latn");
    await expect(
      page.getByRole("combobox", { name: "App ki bhasha" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // The toggle goes back to English from Hinglish too.
    await page.getByRole("button", { name: "EN (English mein badlo)" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("button", { name: "Examples" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "हिं (Switch to Hindi)" }),
    ).toBeVisible();
  });

  test("everyone starts in English, even with a Hindi browser", async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale: "hi-IN" });
    const page = await context.newPage();
    await openPlayground(page, { code: "console.log(1)" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("button", { name: "Examples" })).toBeVisible();
    await expect(page.getByTestId("interface-language-toggle")).toHaveText(
      /हिं/,
    );
    await context.close();
  });
});

test.describe("friendly error explanations", () => {
  test("explain an error under the original message, in the chosen language", async ({
    page,
  }) => {
    await openPlayground(page, {
      code: "const total = 5;\nconsole.log(totl);",
    });
    await run(page);
    await expectStatus(page, "failed");
    const error = consoleOutput(page).locator('[data-kind="runtime-error"]');
    // The real error stays.
    await expect(error).toContainText("totl is not defined");
    const friendly = error.getByTestId("friendly-error");
    await expect(friendly).toContainText(
      "totl is not defined. Check its spelling",
    );
    await friendly.getByRole("button", { name: "Go to line 2" }).click();

    await page.getByTestId("interface-language-toggle").click();
    await expect(friendly).toContainText("इसका मतलब क्या है");
    await expect(error).toContainText("totl is not defined");
  });

  test("explain a timeout", async ({ page }) => {
    await openPlayground(page, {
      code: "while (true) {}",
      settings: { timeoutMs: 2_000 },
    });
    await run(page);
    await expectStatus(page, "timed-out", 15_000);
    await expect(
      consoleOutput(page).getByTestId("friendly-error"),
    ).toContainText("ran past the time limit");
  });
});
