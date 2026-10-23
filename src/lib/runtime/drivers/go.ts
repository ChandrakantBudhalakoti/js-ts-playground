import type { Driver, DriverHost } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Go via the Yaegi interpreter (compiled to js/wasm). Self-contained (see
 * ./types.ts).
 *
 * Go's wasm_exec.js routes os.Stdout, os.Stderr and os.Stdin through
 * `globalThis.fs` and only installs its own (console-only) version when none
 * exists, so the driver installs one backed by the worker's streams first.
 */
export function goDriver(host: DriverHost): Driver {
  let yaegi: any = null;

  function installFs() {
    const enosys = () => {
      const error: any = new Error("not implemented");
      error.code = "ENOSYS";
      return error;
    };
    const unsupported = (...args: any[]) => args[args.length - 1](enosys());
    const decoder = new TextDecoder();
    const writeSync = (fd: number, buffer: Uint8Array) => {
      if (fd === 1) host.stdout.writeBytes(buffer);
      else if (fd === 2) {
        // Before returning a panic (reported as the run's error), Yaegi
        // prints "line:col: panic: main.main(...)", pointing at its own
        // call of main() rather than at the failing line.
        if (!/^\d+:\d+: panic: /.test(decoder.decode(buffer)))
          host.stderr.writeBytes(buffer);
      } else throw enosys();
      return buffer.length;
    };
    const readSync = (
      fd: number,
      buffer: Uint8Array,
      offset: number,
      length: number,
    ) => {
      if (fd !== 0) throw enosys();
      const chunk = host.readStdin(length);
      buffer.set(chunk, offset);
      return chunk.length;
    };
    (globalThis as any).fs = {
      constants: {
        O_WRONLY: -1,
        O_RDWR: -1,
        O_CREAT: -1,
        O_TRUNC: -1,
        O_APPEND: -1,
        O_EXCL: -1,
        O_DIRECTORY: -1,
      },
      writeSync,
      readSync,
      write(
        fd: number,
        buffer: Uint8Array,
        offset: number,
        length: number,
        position: number | null,
        callback: (error: unknown, written?: number) => void,
      ) {
        if (position !== null) return callback(enosys());
        try {
          callback(
            null,
            writeSync(fd, buffer.subarray(offset, offset + length)),
          );
        } catch (error) {
          callback(error);
        }
      },
      read(
        fd: number,
        buffer: Uint8Array,
        offset: number,
        length: number,
        position: number | null,
        callback: (error: unknown, read?: number) => void,
      ) {
        if (position !== null) return callback(enosys());
        try {
          callback(null, readSync(fd, buffer, offset, length));
        } catch (error) {
          callback(error);
        }
      },
      fsync: (_fd: number, callback: (error: unknown) => void) =>
        callback(null),
      chmod: unsupported,
      chown: unsupported,
      close: unsupported,
      fchmod: unsupported,
      fchown: unsupported,
      fstat: unsupported,
      ftruncate: unsupported,
      lchown: unsupported,
      link: unsupported,
      lstat: unsupported,
      mkdir: unsupported,
      open: unsupported,
      readdir: unsupported,
      readlink: unsupported,
      rename: unsupported,
      rmdir: unsupported,
      stat: unsupported,
      symlink: unsupported,
      truncate: unsupported,
      unlink: unsupported,
      utimes: unsupported,
    };
  }

  return {
    async boot() {
      installFs();
      await host.importModule("wasm_exec.js");
      const go = new (globalThis as any).Go();
      const { instance } = await WebAssembly.instantiate(
        host.file("yaegi.wasm") as BufferSource,
        go.importObject,
      );
      // The Go program registers `globalThis.yaegi` and then waits for calls.
      void go.run(instance);
      for (let i = 0; i < 100 && !(globalThis as any).yaegi; i++)
        await new Promise((resolve) => setTimeout(resolve, 10));
      yaegi = (globalThis as any).yaegi;
      if (!yaegi?.eval) throw new Error("The Go interpreter did not start.");
    },

    async run(code: string) {
      const result = yaegi.eval(code);
      if (result?.success) return 0;
      const message = String(result?.error ?? "The program failed.");
      // Compile errors are "line:column: message".
      const located = /^(\d+):(\d+): ([\s\S]*)$/.exec(message);
      if (located) {
        host.reportError({
          name: "",
          message: located[3],
          line: Number(located[1]),
          column: Number(located[2]),
        });
      } else {
        host.reportError({ name: "panic", message });
      }
      return 2;
    },
  };
}
