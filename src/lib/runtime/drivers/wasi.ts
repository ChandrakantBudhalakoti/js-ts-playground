import type { Driver, DriverHost } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Runs a WASI (preview 1) program compiled by Clang. Self-contained (see
 * ./types.ts).
 *
 * The program gets standard input, output and error, the clocks, random
 * bytes and exit; there is no filesystem, so opening files fails with
 * ENOENT. Every other WASI call answers ENOSYS.
 */
export function wasiDriver(host: DriverHost): Driver {
  const ERRNO = { SUCCESS: 0, BADF: 8, INVAL: 28, NOSYS: 52, SPIPE: 70 };
  const FILETYPE_CHARACTER_DEVICE = 2;
  // Read and write only: no seek/tell rights, so libc sees a terminal and
  // line-buffers stdout (output appears even if the program later hangs).
  const STDIO_RIGHTS = BigInt((1 << 1) | (1 << 6));
  const EXIT = { reason: "exit" };

  function describeTrap(error: unknown): { name: string; message: string } {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof RangeError || /call stack/i.test(message))
      return { name: "Stack overflow", message: "recursion too deep" };
    if (/unreachable/i.test(message))
      return {
        name: "Aborted",
        message: "the program called abort() or failed an assertion",
      };
    if (/out of bounds/i.test(message))
      return {
        name: "Segmentation fault",
        message: "memory access out of bounds",
      };
    if (/divide by zero|division by zero/i.test(message))
      return { name: "Arithmetic error", message: "integer division by zero" };
    if (/remainder by zero/i.test(message))
      return { name: "Arithmetic error", message: "integer remainder by zero" };
    return {
      name: error instanceof Error ? error.name : "Error",
      message,
    };
  }

  return {
    async boot() {},

    async run(_code: string, binary: Uint8Array | null) {
      if (!binary) throw new Error("There is no compiled program to run.");
      const wasmModule = await WebAssembly.compile(binary as BufferSource);
      let memory: WebAssembly.Memory | null = null;
      let exitCode = 0;
      const view = () => new DataView(memory!.buffer);
      const memoryBytes = () => new Uint8Array(memory!.buffer);
      const args = ["main"];

      const strings = (list: string[]) =>
        list.map((value) => new TextEncoder().encode(`${value}\0`));
      const writeStrings = (
        list: string[],
        pointers: number,
        buffer: number,
      ) => {
        const dv = view();
        const mem = memoryBytes();
        let offset = buffer;
        strings(list).forEach((encoded, i) => {
          dv.setUint32(pointers + i * 4, offset, true);
          mem.set(encoded, offset);
          offset += encoded.length;
        });
        return ERRNO.SUCCESS;
      };
      const sizes = (list: string[], count: number, size: number) => {
        const dv = view();
        dv.setUint32(count, list.length, true);
        dv.setUint32(
          size,
          strings(list).reduce((sum, encoded) => sum + encoded.length, 0),
          true,
        );
        return ERRNO.SUCCESS;
      };
      const now = (clock: number): bigint =>
        clock === 0
          ? BigInt(Date.now()) * BigInt(1_000_000)
          : BigInt(Math.round(performance.now() * 1_000_000));

      const wasi: Record<string, (...args: any[]) => number> = {
        args_get: (argv: number, buffer: number) =>
          writeStrings(args, argv, buffer),
        args_sizes_get: (count: number, size: number) =>
          sizes(args, count, size),
        environ_get: (environ: number, buffer: number) =>
          writeStrings([], environ, buffer),
        environ_sizes_get: (count: number, size: number) =>
          sizes([], count, size),
        clock_res_get: (_clock: number, resolution: number) => {
          view().setBigUint64(resolution, BigInt(1000), true);
          return ERRNO.SUCCESS;
        },
        clock_time_get: (clock: number, _precision: bigint, time: number) => {
          view().setBigUint64(time, now(clock), true);
          return ERRNO.SUCCESS;
        },
        fd_write: (
          fd: number,
          iovs: number,
          count: number,
          written: number,
        ) => {
          if (fd !== 1 && fd !== 2) return ERRNO.BADF;
          const dv = view();
          let total = 0;
          for (let i = 0; i < count; i++) {
            const pointer = dv.getUint32(iovs + i * 8, true);
            const length = dv.getUint32(iovs + i * 8 + 4, true);
            const chunk = memoryBytes().subarray(pointer, pointer + length);
            (fd === 1 ? host.stdout : host.stderr).writeBytes(chunk);
            total += length;
          }
          view().setUint32(written, total, true);
          return ERRNO.SUCCESS;
        },
        fd_read: (fd: number, iovs: number, count: number, read: number) => {
          if (fd !== 0) return ERRNO.BADF;
          const dv = view();
          let total = 0;
          for (let i = 0; i < count; i++) {
            const pointer = dv.getUint32(iovs + i * 8, true);
            const length = dv.getUint32(iovs + i * 8 + 4, true);
            const chunk = host.readStdin(length);
            memoryBytes().set(chunk, pointer);
            total += chunk.length;
            if (chunk.length < length) break;
          }
          view().setUint32(read, total, true);
          return ERRNO.SUCCESS;
        },
        fd_fdstat_get: (fd: number, stat: number) => {
          if (fd > 2) return ERRNO.BADF;
          const dv = view();
          dv.setUint8(stat, FILETYPE_CHARACTER_DEVICE);
          dv.setUint16(stat + 2, 0, true);
          dv.setBigUint64(stat + 8, STDIO_RIGHTS, true);
          dv.setBigUint64(stat + 16, BigInt(0), true);
          return ERRNO.SUCCESS;
        },
        fd_filestat_get: (fd: number, stat: number) => {
          if (fd > 2) return ERRNO.BADF;
          memoryBytes().fill(0, stat, stat + 64);
          view().setUint8(stat + 16, FILETYPE_CHARACTER_DEVICE);
          return ERRNO.SUCCESS;
        },
        fd_seek: (fd: number) => (fd > 2 ? ERRNO.BADF : ERRNO.SPIPE),
        fd_tell: (fd: number) => (fd > 2 ? ERRNO.BADF : ERRNO.SPIPE),
        fd_close: (fd: number) => (fd > 2 ? ERRNO.BADF : ERRNO.SUCCESS),
        fd_sync: () => ERRNO.SUCCESS,
        fd_datasync: () => ERRNO.SUCCESS,
        // No preopened directories: there is no filesystem.
        fd_prestat_get: () => ERRNO.BADF,
        fd_prestat_dir_name: () => ERRNO.BADF,
        random_get: (buffer: number, length: number) => {
          for (let offset = 0; offset < length; offset += 65_536) {
            crypto.getRandomValues(
              memoryBytes().subarray(
                buffer + offset,
                buffer + Math.min(length, offset + 65_536),
              ),
            );
          }
          return ERRNO.SUCCESS;
        },
        sched_yield: () => ERRNO.SUCCESS,
        // Clock subscriptions only (sleep): the worker busy-waits, as it has
        // nothing else to do. Reads from stdin are always ready.
        poll_oneoff: (
          input: number,
          output: number,
          count: number,
          events: number,
        ) => {
          const dv = view();
          let deadline = 0;
          for (let i = 0; i < count; i++) {
            const sub = input + i * 48;
            if (dv.getUint8(sub + 8) !== 0) continue;
            const clock = dv.getUint32(sub + 16, true);
            const timeout = dv.getBigUint64(sub + 24, true);
            const absolute = (dv.getUint16(sub + 40, true) & 1) === 1;
            const target = absolute
              ? Number(timeout - now(clock)) / 1e6 + performance.now()
              : Number(timeout) / 1e6 + performance.now();
            deadline = Math.max(deadline, target);
          }
          while (performance.now() < deadline) {
            // sleeping
          }
          for (let i = 0; i < count; i++) {
            const sub = input + i * 48;
            const event = output + i * 32;
            dv.setBigUint64(event, dv.getBigUint64(sub, true), true);
            dv.setUint16(event + 8, ERRNO.SUCCESS, true);
            dv.setUint8(event + 10, dv.getUint8(sub + 8));
          }
          dv.setUint32(events, count, true);
          return ERRNO.SUCCESS;
        },
        proc_exit: (code: number) => {
          exitCode = code;
          throw EXIT;
        },
      };

      const imports = {
        wasi_snapshot_preview1: new Proxy(wasi, {
          get: (target, name: string) => target[name] ?? (() => ERRNO.NOSYS),
        }),
      };
      const instance = await WebAssembly.instantiate(wasmModule, imports);
      memory = instance.exports.memory as WebAssembly.Memory;
      try {
        (instance.exports._start as () => void)();
      } catch (error) {
        if (error === EXIT) return exitCode;
        const trap = describeTrap(error);
        host.reportError(trap);
        return 134;
      }
      return 0;
    },
  };
}
