import { createHash } from "node:crypto";
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

export async function GET() {
  // Render at request time so the environment is read when the server runs.
  await connection();
  const document = sandboxDocument;
  const frameAncestors =
    process.env.SANDBOX_FRAME_ANCESTORS?.trim() || "'self'";

  return new Response(document.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": sandboxContentSecurityPolicy(
        document.scriptHash,
        frameAncestors,
      ),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), display-capture=(), fullscreen=()",
      "Cache-Control": "public, max-age=600",
      "X-Robots-Tag": "noindex",
    },
  });
}
