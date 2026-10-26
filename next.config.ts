import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Where the code-execution sandbox page lives. Defaults to this app's own
 * `/sandbox` route; in production point it at a separate origin (see README).
 */
const sandboxUrl = process.env.NEXT_PUBLIC_SANDBOX_URL || "/sandbox";

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "'self'"; // relative URL: same origin
  }
}

const appContentSecurityPolicy = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' lets the C/C++ compiler worker compile Clang (a
  // WebAssembly module); it does not allow eval() of JavaScript.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  // Next.js needs inline <script> elements while pages are prerendered (a
  // nonce would make every page dynamic), but nothing uses inline event
  // handlers. Blocking them disarms the usual payload of HTML that slips
  // past a sanitizer, such as Monaco's markdown hovers of JSDoc comments
  // from a share link (`<img src=x onerror=…>`).
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  `frame-src ${originOf(sandboxUrl)}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    NEXT_PUBLIC_SANDBOX_URL: sandboxUrl,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Everything except the sandbox page, which sets its own, stricter policy.
        source: "/((?!sandbox$).*)",
        headers: [
          { key: "Content-Security-Policy", value: appContentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          // A page that opens the app with window.open() gets no handle on
          // it, so it cannot keep rewriting the URL hash (share links).
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // Browsers ignore it over plain HTTP (local `next start`).
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
        ],
      },
      {
        // Monaco, the TypeScript libs and the language runtimes (~75 MB) are
        // only for this app: other sites may not embed them.
        source: "/vendor/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        // Monaco's files are fully determined by the versioned path.
        source: "/vendor/monaco/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // lib.json also depends on lib-roots.json and the bundling script,
        // not just the TypeScript version in its path, so browsers must
        // revalidate it (cheap: a 304 when unchanged).
        source: "/vendor/typescript/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        // Language runtimes and Clang: each file is fixed by the package
        // version in its path...
        source: "/vendor/runtimes/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // ...but which files are published also depends on
        // runtime-assets.json, so the list is revalidated (later rules win).
        source: "/vendor/runtimes/:runtime/:version/index.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
