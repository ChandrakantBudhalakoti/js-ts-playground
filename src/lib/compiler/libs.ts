const REFERENCE_LIB = /^\/\/\/\s*<reference\s+lib=["']([^"']+)["']\s*\/>/gm;

/** Names referenced via `/// <reference lib="..." />`, as file names (`lib.es2015.d.ts`). */
export function referencedLibFiles(content: string): string[] {
  const names: string[] = [];
  for (const match of content.matchAll(REFERENCE_LIB)) {
    names.push(`lib.${match[1].toLowerCase()}.d.ts`);
  }
  return names;
}

/**
 * Load the given lib files and everything they transitively reference.
 * TypeScript's language service host is synchronous, so all libs must be in
 * memory before the service is created.
 */
export async function loadLibFiles(
  roots: readonly string[],
  load: (fileName: string) => Promise<string | undefined>,
): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const pending = new Set<string>(roots);
  const requested = new Set<string>();

  while (pending.size > 0) {
    const batch = [...pending].filter((name) => !requested.has(name));
    pending.clear();
    batch.forEach((name) => requested.add(name));

    const contents = await Promise.all(
      batch.map(async (name) => [name, await load(name)] as const),
    );
    for (const [name, content] of contents) {
      if (content === undefined) {
        throw new Error(`TypeScript library file "${name}" is not available.`);
      }
      files.set(name, content);
      for (const ref of referencedLibFiles(content)) {
        if (!requested.has(ref)) pending.add(ref);
      }
    }
  }
  return files;
}
