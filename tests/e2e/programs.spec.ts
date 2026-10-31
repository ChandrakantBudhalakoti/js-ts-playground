import { expect, test } from "@playwright/test";
import { languageInfo } from "../../src/lib/languages";
import {
  forLanguage,
  programExampleId,
  programPath,
  PROGRAMS,
  runnableLanguages,
} from "../../src/lib/programs";
import {
  expectLanguage,
  expectStatus,
  loggedLines,
  openPlayground,
  run,
} from "./helpers";

/**
 * Every beginner program in every language the playground runs prints
 * exactly its stated output for its sample input. Runs in the languages
 * projects, after the other suites (playwright.config.ts).
 */
test.describe.configure({ timeout: 180_000 });

for (const language of runnableLanguages()) {
  test.describe(`${languageInfo(language).name} programs`, () => {
    for (const program of PROGRAMS) {
      test(`${program.slug} prints its stated output`, async ({
        page,
        browserName,
      }) => {
        test.skip(
          browserName === "firefox" && program.slug !== "hello-world",
          "one program per language in Firefox",
        );
        await openPlayground(page, {
          query: `example=${programExampleId(program, language)}`,
        });
        await expectLanguage(page, languageInfo(language).name);
        if (program.stdin) {
          await page.getByRole("tab", { name: /Input/ }).click();
          await expect(page.getByTestId("stdin-input")).toHaveValue(
            program.stdin,
          );
        }
        await run(page);
        await expectStatus(page, "completed", 120_000);
        // Printed text is batched into console entries, always at line ends
        // for these programs, so the entries joined by newlines are the output.
        await expect
          .poll(async () =>
            (await loggedLines(page).allInnerTexts()).join("\n"),
          )
          .toBe(program.output);
      });
    }
  });
}

test("a program page shows the code and opens it in the playground", async ({
  page,
}) => {
  const language = runnableLanguages().includes("c") ? "c" : "python";
  const program = PROGRAMS.find((p) => p.slug === "prime-number")!;
  await page.goto(programPath(program, language));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    forLanguage(program.heading, language),
  );
  await expect(
    page.getByLabel(languageInfo(language).fileName, { exact: true }),
  ).toContainText("int main(void)");
  await expect(page.getByLabel("Program output")).toContainText(
    program.output.split("\n").at(-1)!,
  );
  await page
    .getByRole("link", { name: "Open in the playground" })
    .first()
    .click();
  await expectLanguage(page, languageInfo(language).name);
  await expect(page.getByTestId("run-button")).toBeVisible();
});
