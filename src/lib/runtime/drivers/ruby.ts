import type { Driver, DriverHost } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CRuby via ruby.wasm (with its bundled standard library). Self-contained
 * (see ./types.ts).
 *
 * ruby.wasm's console printer takes `console.log`/`console.warn` when the VM
 * is created and hands them raw chunks of stdout/stderr, so the driver swaps
 * in writers for that moment. Standard input is fd 0 of its WASI shim.
 */
export function rubyDriver(host: DriverHost): Driver {
  // Evaluates the program as main.rb at the top level and reports how it
  // ended through the JavaScript callbacks set in run().
  const RUNNER = String.raw`
require "js"
__playground_status = 0
begin
  TOPLEVEL_BINDING.eval(JS.global[:__playgroundCode].to_s, "main.rb", 1)
rescue SystemExit => error
  __playground_status = error.status
rescue Exception => error
  frames = (error.backtrace || []).select { |frame| frame.start_with?("main.rb:") }
  JS.global.call(:__playgroundError, error.class.name, error.message.to_s, frames.join("\n"))
  __playground_status = 1
ensure
  $stdout.flush
  $stderr.flush
end
__playground_status
`;

  let vm: any = null;
  let wasi: any = null;

  return {
    async boot() {
      await host.importModule("ruby-wasm-wasi.js");
      const { DefaultRubyVM } = (globalThis as any)["ruby-wasm-wasi"];
      const wasmModule = await WebAssembly.compile(
        host.file("ruby.wasm") as BufferSource,
      );
      const console = (globalThis as any).console;
      const { log, warn } = console;
      console.log = (text: unknown) => host.stdout.write(String(text));
      console.warn = (text: unknown) => host.stderr.write(String(text));
      try {
        ({ vm, wasi } = await DefaultRubyVM(wasmModule, {
          consolePrint: true,
        }));
      } finally {
        console.log = log;
        console.warn = warn;
      }
    },

    async run(code: string) {
      const stdin = wasi.fds[0];
      stdin.file.data = host.stdinBytes();
      stdin.file_pos = BigInt(0);
      const scope = globalThis as any;
      scope.__playgroundCode = code;
      scope.__playgroundError = (
        name: string,
        message: string,
        frames: string,
      ) => {
        const location =
          /^main\.rb:(\d+)/.exec(frames) ?? /main\.rb:(\d+)/.exec(message);
        // Syntax errors repeat the file name in their message.
        const text = message.replace(/^main\.rb:\d+: /, "");
        host.reportError({
          name,
          message: text,
          stack: frames || undefined,
          line: location ? Number(location[1]) : undefined,
        });
      };
      const status = vm.eval(RUNNER);
      return Number(status.toString());
    },
  };
}
