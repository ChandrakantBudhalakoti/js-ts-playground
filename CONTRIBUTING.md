# Contributing to CodeTakhti

Thanks for helping! Bug reports, examples, documentation fixes and code
changes are all welcome.

- **Found a bug?** [Open a bug report](https://github.com/ChandrakantBudhalakoti/js-ts-playground/issues/new?template=bug_report.yml).
  A share link from the playground is the fastest way to show the problem.
- **Have an idea?** [Open a feature request](https://github.com/ChandrakantBudhalakoti/js-ts-playground/issues/new?template=feature_request.yml)
  before starting on anything large, so we can agree on the approach.
- **Security issue?** Don't open an issue; see [SECURITY.md](SECURITY.md).
- **Looking for something to do?** Try issues labelled
  [`good first issue`](https://github.com/ChandrakantBudhalakoti/js-ts-playground/labels/good%20first%20issue)
  or [`help wanted`](https://github.com/ChandrakantBudhalakoti/js-ts-playground/labels/help%20wanted).

## Set up

You need Node.js 22 or newer (CI uses the version in `.nvmrc`) and npm.

```bash
git clone https://github.com/ChandrakantBudhalakoti/js-ts-playground.git
cd js-ts-playground
npm install                              # also copies Monaco, the TypeScript libs and the language runtimes into public/vendor
npx playwright install chromium firefox  # once, for the browser tests
npm run dev                              # http://localhost:3000
```

The editor is at <http://localhost:3000/playground>; the other routes are the
website pages.

## Before you open a pull request

```bash
npm run check      # lint, types, formatting, unit tests and production build
npm run test:e2e   # browser tests in Chromium, Firefox and a mobile viewport
```

CI runs the same checks on every pull request. `npm run format` fixes
formatting.

- Keep pull requests focused: one fix or feature each.
- Add or update tests for behaviour you change. Unit tests live in
  `tests/unit` (Vitest), browser tests in `tests/e2e` (Playwright).
- Update the README when you change behaviour, scripts or setup, and keep it
  accurate: only describe what the code actually does.
- Write commit messages in the imperative ("Add …", "Fix …").

## Where things live

| You want to change…                | Look in                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| The editor page                    | `src/app/playground`, `src/components/playground/Playground.tsx`                |
| Toolbar, console, Problems panel   | `src/components/editor`, `src/components/console`, `src/components/diagnostics` |
| Type checking and compiling        | `src/lib/compiler` (runs in a Web Worker)                                       |
| How code runs                      | `src/lib/runtime`, `src/app/sandbox/route.ts`                                   |
| Languages and their runtimes       | `src/lib/languages.ts`, `src/lib/runtime/drivers`, `runtime-assets.json`        |
| C and C++ compilation              | `src/lib/clang` (Clang runs in a Web Worker of the app)                         |
| Website pages (home, guides, …)    | `src/app/(site)`, `src/components/site`                                         |
| Page titles, descriptions, sitemap | `src/lib/metadata.ts`, `src/lib/site.ts`, `src/app/sitemap.ts`                  |

The README's [Architecture](README.md#architecture) section explains how the
pieces fit together.

## Adding an example

Examples appear in the editor's **Examples** menu and on the `/javascript`,
`/typescript` and `/examples` pages.

1. Add it to `EXAMPLES` in `src/lib/examples.ts` with a unique `id`.
   It must compile without diagnostics (a unit test checks every example; the
   type-errors demo is the only exception).
   Examples in the other languages go in `src/lib/language-examples.ts`
   (with `stdin` if they read input) and need a line of their output in
   `EXPECTED_OUTPUT` in `tests/e2e/languages.spec.ts`, which runs them all.
2. It can be opened directly at `/playground?example=<id>`.

To also give it a guide page at `/examples/<slug>`:

1. Add an entry to `GUIDES` in `src/lib/guides.ts`. `output` must be exactly
   what the console prints, line by line: `tests/e2e/guides.spec.ts` runs the
   example and compares.
2. Create `src/app/(site)/examples/<slug>/page.tsx` like the existing ones.
   The page is added to the sitemap automatically.
3. Keep titles and descriptions unique; unit and browser tests check this.

## Rules for the sandbox

Changes near code execution get extra scrutiny. Please don't:

- add `allow-same-origin` (or other permissions) to the sandbox iframe;
- loosen the `/sandbox` Content Security Policy or the app's CSP;
- render console output as HTML;
- accept messages from the sandbox without the existing origin, channel,
  run-ID, schema and size checks;
- let a language runtime reach the network: the runtime worker's `fetch` and
  `XMLHttpRequest` only answer the runtime's own virtual URLs from memory.

`node scripts/verify-security-headers.mjs <url>` checks the headers of a
running server; CI runs it against every build.

## Upgrading Monaco or TypeScript

`monaco-editor` bundles its own TypeScript, so `typescript` must match it.
See [CI and the release gate](README.md#ci-and-the-release-gate) in the README
before changing either.

## Upgrading a language runtime

The runtime packages (Pyodide, wasmoon, ruby.wasm, php-wasm, yaegi-wasm,
webR and YoWASP Clang) are pinned to exact versions, and Dependabot leaves
them alone: their drivers in `src/lib/runtime/drivers` rely on how those
builds load and print. To upgrade one, change its version in `package.json`
and `src/lib/runtime/runtime-assets.json` together (`npm run dev` and a unit
test fail if they differ), then run `npm run test:e2e`, which runs every
example of every language in Chromium and the first one in Firefox.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
