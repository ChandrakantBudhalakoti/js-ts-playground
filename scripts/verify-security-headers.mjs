// Verifies the security-critical response headers and the sandbox page of a
// running server (used by CI against the production build).
//
//   node scripts/verify-security-headers.mjs http://localhost:3300
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function fetchWithRetry(url, attempts = 60) {
  for (let i = 1; ; i++) {
    try {
      return await fetch(url, { redirect: "manual" });
    } catch (error) {
      if (i >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

function directives(csp) {
  const map = new Map();
  for (const part of (csp ?? "").split(";")) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) map.set(name.toLowerCase(), values);
  }
  return map;
}

// --- Sandbox page ----------------------------------------------------------
const sandbox = await fetchWithRetry(`${base}/sandbox`);
check(sandbox.status === 200, `/sandbox returned HTTP ${sandbox.status}`);
const sandboxHtml = await sandbox.text();
const sandboxCsp = directives(sandbox.headers.get("content-security-policy"));

check(sandboxCsp.size > 0, "/sandbox has no Content-Security-Policy header");
check(
  sandboxCsp.get("sandbox")?.join(" ") === "allow-scripts",
  "/sandbox CSP must be `sandbox allow-scripts` (no allow-same-origin)",
);
check(
  sandboxCsp.get("default-src")?.join(" ") === "'none'",
  "/sandbox CSP default-src must be 'none'",
);
check(
  sandboxCsp.get("connect-src")?.join(" ") === "'none'",
  "/sandbox CSP must block the network (connect-src 'none')",
);
check(
  !sandboxCsp.get("script-src")?.includes("'unsafe-inline'"),
  "/sandbox CSP must not allow 'unsafe-inline' scripts",
);
check(
  sandboxCsp.has("frame-ancestors"),
  "/sandbox CSP must set frame-ancestors",
);
check(
  sandbox.headers.get("x-content-type-options") === "nosniff",
  "/sandbox is missing X-Content-Type-Options: nosniff",
);
// fetch() accepts gzip and br, like browsers.
check(
  ["br", "gzip"].includes(sandbox.headers.get("content-encoding") ?? ""),
  "/sandbox should be compressed for clients that accept it",
);

const script = /<script>([\s\S]*)<\/script>/.exec(sandboxHtml)?.[1];
check(Boolean(script), "/sandbox has no inline bootstrap script");
if (script) {
  const hash = createHash("sha256").update(script).digest("base64");
  check(
    sandboxCsp.get("script-src")?.includes(`'sha256-${hash}'`),
    "/sandbox CSP script hash does not match the inline bootstrap script",
  );
  // Bundler helpers would be undefined inside the self-contained sandbox code.
  check(
    !/__TURBOPACK__|turbopack_context|__webpack_require__|__vite_ssr/.test(
      script,
    ),
    "/sandbox bootstrap references bundler-injected identifiers",
  );
}

// --- App page ----------------------------------------------------------------
const app = await fetchWithRetry(`${base}/`);
check(app.status === 200, `/ returned HTTP ${app.status}`);
const appCsp = directives(app.headers.get("content-security-policy"));
check(appCsp.size > 0, "/ has no Content-Security-Policy header");
check(
  appCsp.get("frame-ancestors")?.join(" ") === "'none'",
  "/ CSP must forbid framing (frame-ancestors 'none')",
);
check(
  appCsp.get("object-src")?.join(" ") === "'none'",
  "/ CSP must set object-src 'none'",
);
check(
  !appCsp.get("script-src")?.includes("'unsafe-eval'"),
  "/ CSP must not allow 'unsafe-eval' in production",
);
check(
  appCsp.get("script-src-attr")?.join(" ") === "'none'",
  "/ CSP must block inline event handlers (script-src-attr 'none')",
);
check(appCsp.has("frame-src"), "/ CSP must restrict frame-src");
check(
  app.headers.get("x-frame-options") === "DENY",
  "/ is missing X-Frame-Options: DENY",
);
check(
  app.headers.get("cross-origin-opener-policy") === "same-origin",
  "/ is missing Cross-Origin-Opener-Policy: same-origin",
);
check(
  /max-age=\d{8,}/.test(app.headers.get("strict-transport-security") ?? ""),
  "/ is missing a long-lived Strict-Transport-Security header",
);

// --- Self-hosted assets --------------------------------------------------------
const require = createRequire(import.meta.url);
const tsVersion = require("typescript/package.json").version;
// monaco-editor's "exports" map hides package.json from require().
const monacoVersion = JSON.parse(
  readFileSync(
    new URL("../node_modules/monaco-editor/package.json", import.meta.url),
    "utf8",
  ),
).version;
const runtimeSpecs = JSON.parse(
  readFileSync(
    new URL("../src/lib/runtime/runtime-assets.json", import.meta.url),
    "utf8",
  ),
);
const assets = [
  // Content fully determined by the versioned path: cache forever.
  {
    path: `/vendor/monaco/${monacoVersion}/vs/loader.js`,
    cache: /immutable/,
    expectation: "an immutable Cache-Control header",
  },
  // Content also depends on lib-roots.json: must be revalidated.
  {
    path: `/vendor/typescript/${tsVersion}/lib.json`,
    cache: /^(?!.*immutable).*(no-cache|must-revalidate)/,
    expectation: "a revalidating (not immutable) Cache-Control header",
  },
  // Language runtimes: files are fixed by the version in their path, but the
  // list of files depends on runtime-assets.json.
  {
    path: `/vendor/runtimes/lua/${runtimeSpecs.lua.version}/glue.wasm.gz`,
    cache: /immutable/,
    expectation: "an immutable Cache-Control header",
  },
  {
    path: `/vendor/runtimes/lua/${runtimeSpecs.lua.version}/index.json`,
    cache: /^(?!.*immutable).*(no-cache|must-revalidate)/,
    expectation: "a revalidating (not immutable) Cache-Control header",
  },
];
for (const { path, cache, expectation } of assets) {
  const asset = await fetchWithRetry(`${base}${path}`);
  check(asset.status === 200, `${path} returned HTTP ${asset.status}`);
  check(
    cache.test(asset.headers.get("cache-control") ?? ""),
    `${path} should be served with ${expectation}`,
  );
  check(
    asset.headers.get("cross-origin-resource-policy") === "same-origin",
    `${path} should be served with Cross-Origin-Resource-Policy: same-origin`,
  );
}

// --- Runtime configuration ------------------------------------------------------
// SANDBOX_FRAME_ANCESTORS must be read per request, not baked in at build time.
if (process.env.SANDBOX_FRAME_ANCESTORS) {
  check(
    sandboxCsp.get("frame-ancestors")?.join(" ") ===
      process.env.SANDBOX_FRAME_ANCESTORS.trim(),
    "/sandbox frame-ancestors does not reflect SANDBOX_FRAME_ANCESTORS",
  );
}

if (failures.length > 0) {
  console.error(`Security header check failed for ${base}:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(`Security headers verified for ${base}`);
