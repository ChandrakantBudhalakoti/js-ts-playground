import type { ScriptLanguage } from "@/types/playground";

export interface FormatOptions {
  tabWidth: number;
}

export class FormatError extends Error {
  constructor(
    message: string,
    readonly line?: number,
    readonly column?: number,
  ) {
    super(message);
    this.name = "FormatError";
  }
}

/** Format code with Prettier. Prettier and its plugins are loaded on first use. */
export async function formatCode(
  code: string,
  language: ScriptLanguage,
  options: FormatOptions,
): Promise<string> {
  const [prettier, babel, estree, typescript] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/typescript"),
  ]);
  try {
    return await prettier.format(code, {
      parser: language === "typescript" ? "typescript" : "babel",
      plugins: [babel, estree, typescript],
      tabWidth: options.tabWidth,
      useTabs: false,
      printWidth: 80,
    });
  } catch (error) {
    const loc = (
      error as { loc?: { start?: { line?: number; column?: number } } }
    ).loc?.start;
    const raw = error instanceof Error ? error.message : String(error);
    // Prettier appends a code frame after the first line; keep the summary.
    const message = raw.split("\n")[0].replace(/\s*\(\d+:\d+\)$/, "");
    throw new FormatError(message, loc?.line, loc?.column);
  }
}
