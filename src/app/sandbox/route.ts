import { createHash } from "node:crypto";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { connection } from "next/server";
import {
  buildSandboxDocument,
  sandboxContentSecurityPolicy,
} from "@/lib/runtime/sandbox-document";

/**
 * The code-execution sandbox page. It is framed by the playground with
 * `sandbox="allow-scripts"`, and its own CSP repeats the sandbox (opaque
 * origin even when opened directly), blocks the network and restricts who
 * may frame it.
 *
 * SANDBOX_FRAME_ANCESTORS: space-separated origins allowed to embed this page
 * (default `'self'`). Set it to the app's origin when the sandbox is deployed
 * on a separate origin. It is read on every request (not at build time), so
 * one build can be deployed with different values.
 */
const sandboxDocument = buildSandboxDocument((input) =>
  createHash("sha256").update(input).digest("base64"),
);

/**
 * The page compressed once (34 KB of scripts, about a quarter of that
 * compressed): `next start` does not compress route handlers, and each
 * browser loads the page on its first run.
 */
const compressed = {
  br: new Uint8Array(brotliCompressSync(sandboxDocument.html)),
  gzip: new Uint8Array(gzipSync(sandboxDocument.html, { level: 9 })),
};

export async function GET(request: Request) {
  // Render at request time so the environment is read when the server runs.
  await connection();
  const document = sandboxDocument;
  const frameAncestors =
    process.env.SANDBOX_FRAME_ANCESTORS?.trim() || "'self'";
  const versioned = new URL(request.url).searchParams.has("v");
  const accepted = request.headers.get("accept-encoding") ?? "";
  const encoding = /\bbr\b/.test(accepted)
    ? "br"
    : /\bgzip\b/.test(accepted)
      ? "gzip"
      : null;

  return new Response(encoding ? compressed[encoding] : document.html, {
    headers: {
      ...(encoding && { "Content-Encoding": encoding }),
      Vary: "Accept-Encoding",
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": sandboxContentSecurityPolicy(
        document.scriptHash,
        frameAncestors,
      ),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Strict-Transport-Security": "max-age=63072000",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), display-capture=(), fullscreen=()",
      // The app asks for /sandbox?v=<build>: that exact page never changes,
      // so the browser may keep it, and runs keep working offline.
      "Cache-Control": versioned
        ? "public, max-age=31536000, immutable"
        : "public, max-age=600",
      "X-Robots-Tag": "noindex",
    },
  });
}
