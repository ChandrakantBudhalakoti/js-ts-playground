import type { Driver, DriverHost } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CPython via Pyodide. Self-contained (see ./types.ts).
 *
 * Pyodide's loader would fetch its pieces itself; instead the asm module is
 * imported from memory and passed in, and the wasm, standard library and lock
 * file are served by the worker's virtual `fetch`.
 */
export function pythonDriver(host: DriverHost): Driver {
  // Runs the user's code as __main__, with top-level await allowed, and
  // describes how it ended as JSON (only the user's own frames are kept).
  const RUNNER = String.raw`
import json, sys, traceback
from pyodide.code import eval_code_async

async def __playground_run(source):
    namespace = {"__name__": "__main__", "__builtins__": __builtins__}
    result = {"status": "ok"}
    try:
        await eval_code_async(source, namespace, filename="main.py", return_mode="none")
    except SystemExit as exit:
        code = exit.code
        if code is None:
            code = 0
        elif not isinstance(code, int):
            print(code, file=sys.stderr)
            code = 1
        result = {"status": "exit", "code": code}
    except BaseException as error:
        frames = [frame for frame in traceback.extract_tb(error.__traceback__) if frame.filename == "main.py"]
        line = frames[-1].lineno if frames else None
        column = (frames[-1].colno or 0) + 1 if frames and getattr(frames[-1], "colno", None) is not None else 1
        message = str(error)
        if isinstance(error, SyntaxError) and error.filename == "main.py":
            line = error.lineno
            column = error.offset or 1
            message = error.msg
        stack = ""
        if frames:
            stack = "Traceback (most recent call last):\n" + "".join(traceback.format_list(frames))
        result = {"status": "error", "name": type(error).__name__, "message": message, "stack": stack, "line": line, "column": column}
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
    return json.dumps(result)

__playground_run
`;

  let pyodide: any = null;
  let runner: any = null;

  return {
    async boot() {
      const [{ loadPyodide }, asm] = await Promise.all([
        host.importModule("pyodide.mjs"),
        host.importModule("pyodide.asm.mjs"),
      ]);
      pyodide = await loadPyodide({
        indexURL: host.baseUrl,
        packageBaseUrl: host.baseUrl,
        lockFileContents: host.text("pyodide-lock.json"),
        stdLibURL: `${host.baseUrl}python_stdlib.zip`,
        createPyodideModule: asm.default,
        env: { HOME: "/home/user" },
      });
      // isatty: Python line-buffers a terminal, so output appears as it is
      // printed even if the program later hangs.
      pyodide.setStdout({
        isatty: true,
        write: (bytes: Uint8Array) => {
          host.stdout.writeBytes(bytes);
          return bytes.length;
        },
      });
      pyodide.setStderr({
        isatty: true,
        write: (bytes: Uint8Array) => {
          host.stderr.writeBytes(bytes);
          return bytes.length;
        },
      });
      pyodide.setStdin({
        read: (buffer: Uint8Array) => {
          const chunk = host.readStdin(buffer.length);
          buffer.set(chunk);
          return chunk.length;
        },
      });
      runner = pyodide.runPython(RUNNER);
    },

    async run(code: string) {
      const result = JSON.parse(await runner(code));
      if (result.status === "exit") return result.code;
      if (result.status === "error") {
        host.reportError({
          name: result.name,
          message: result.message,
          stack: result.stack || undefined,
          line: result.line ?? undefined,
          column: result.column ?? undefined,
        });
        return 1;
      }
      return 0;
    },
  };
}
