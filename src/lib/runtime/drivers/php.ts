import type { Driver, DriverHost } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * PHP via the WordPress Playground php-wasm build, run as the command-line
 * `php main.php`. Self-contained (see ./types.ts).
 */
export function phpDriver(host: DriverHost): Driver {
  let php: any = null;

  const bytes = (chunk: ArrayBufferView) =>
    new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);

  return {
    async boot() {
      const { init } = await host.importModule("php.js");
      await new Promise<void>((resolve, reject) => {
        php = init("WORKER", {
          ENV: {},
          noInitialRun: true,
          wasmBinary: host.file("php.wasm"),
          locateFile: (path: string) => `${host.baseUrl}${path}`,
          onStdout: (chunk: ArrayBufferView) =>
            host.stdout.writeBytes(bytes(chunk)),
          onStderr: (chunk: ArrayBufferView) =>
            host.stderr.writeBytes(bytes(chunk)),
          // Called for each byte of standard input; null is the end.
          stdin: () => {
            const next = host.readStdin(1);
            return next.length ? next[0] : null;
          },
          onAbort: (reason: unknown) => reject(new Error(String(reason))),
          onRuntimeInitialized: () => resolve(),
        });
      });
    },

    async run(code: string) {
      php.FS.writeFile("/main.php", code);
      for (const arg of [
        "php",
        // Errors go to stderr (shown in red), once, as plain text.
        "-d",
        "display_errors=stderr",
        "-d",
        "log_errors=0",
        "-d",
        "html_errors=0",
        "/main.php",
      ])
        php.ccall("wasm_add_cli_arg", null, ["string"], [arg]);
      try {
        const status = await php.ccall("run_cli", null, [], [], {
          async: true,
        });
        return typeof status === "number" ? status : 0;
      } catch (error: any) {
        // PHP ends with exit(), which emscripten reports by throwing.
        if (error?.name === "ExitStatus" && typeof error.status === "number")
          return error.status;
        throw error;
      }
    },
  };
}
