import type { Driver, DriverHost } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Lua 5.4 via wasmoon. Self-contained (see ./types.ts).
 *
 * wasmoon's C stdio goes through emscripten's line-buffered terminal, which
 * keeps a final line without a newline to itself, and has no standard input.
 * So `print`, `io.write` and the `io.stdout`/`io.stderr`/`io.stdin` methods
 * are replaced by small Lua functions over the worker's own streams.
 */
export function luaDriver(host: DriverHost): Driver {
  const PRELUDE = String.raw`
local out, err, read = __playground_out, __playground_err, __playground_read
__playground_out, __playground_err, __playground_read = nil, nil, nil
local select, tostring, type, concat = select, tostring, type, table.concat
local mtype, format = math.type, string.format

local function chunks(write, ...)
  for i = 1, select("#", ...) do
    local value = select(i, ...)
    if type(value) == "number" then
      value = mtype(value) == "integer" and format("%d", value) or format("%.14g", value)
    elseif type(value) ~= "string" then
      error(format("bad argument #%d to 'write' (string expected, got %s)", i, type(value)), 3)
    end
    write(value)
  end
end

function print(...)
  local parts = {}
  for i = 1, select("#", ...) do parts[i] = tostring((select(i, ...))) end
  out(concat(parts, "\t") .. "\n")
end

local function readall(...)
  local count = select("#", ...)
  if count == 0 then return read("l") end
  local results = {}
  for i = 1, count do
    local value = read((select(i, ...)))
    results[i] = value
    if value == nil then return table.unpack(results, 1, i) end
  end
  return table.unpack(results, 1, count)
end

local file = getmetatable(io.stdout).__index
local stdout, stderr, stdin = io.stdout, io.stderr, io.stdin
local fwrite, fread, flines = file.write, file.read, file.lines
function file.write(f, ...)
  if f == stdout then chunks(out, ...) return f end
  if f == stderr then chunks(err, ...) return f end
  return fwrite(f, ...)
end
function file.read(f, ...)
  if f == stdin then return readall(...) end
  return fread(f, ...)
end
function file.lines(f, ...)
  if f == stdin then
    local formats = table.pack(...)
    return function() return readall(table.unpack(formats, 1, formats.n)) end
  end
  return flines(f, ...)
end
local lines = io.lines
function io.write(...) chunks(out, ...) return stdout end
function io.read(...) return readall(...) end
function io.lines(name, ...)
  if name == nil then return stdin:lines(...) end
  return lines(name, ...)
end
`;

  let engine: any = null;
  // The whole input is known before the program starts.
  let input: string | null = null;

  /** Standard input as Lua's `io.read` formats see it (counts are characters). */
  function read(format: unknown): string | number | undefined {
    input ??= new TextDecoder().decode(host.readAllStdin());
    if (typeof format === "number") {
      // At the end of input every count (even 0) reads nil.
      if (!input) return undefined;
      if (format <= 0) return "";
      const chunk = input.slice(0, format);
      input = input.slice(chunk.length);
      return chunk;
    }
    const mode = String(format ?? "l").replace(/^\*/, "")[0];
    if (mode === "a") {
      const all = input;
      input = "";
      return all;
    }
    if (mode === "n") {
      const match =
        /^\s*([+-]?(?:0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?))/.exec(
          input,
        );
      if (!match) return undefined;
      input = input.slice(match[0].length);
      return Number(match[1]);
    }
    // "l" (without the newline) or "L" (with it)
    if (!input) return undefined;
    const end = input.indexOf("\n");
    const lineEnd = end === -1 ? input.length : end + 1;
    const lineText = input.slice(0, lineEnd);
    input = input.slice(lineEnd);
    return mode === "L" ? lineText : lineText.replace(/\r?\n$/, "");
  }

  return {
    async boot() {
      await host.importModule("wasmoon.js");
      const { LuaFactory } = (globalThis as any).wasmoon;
      const factory = new LuaFactory(`${host.baseUrl}glue.wasm`);
      engine = await factory.createEngine();
      engine.global.set("__playground_out", (text: string) =>
        host.stdout.write(String(text)),
      );
      engine.global.set("__playground_err", (text: string) =>
        host.stderr.write(String(text)),
      );
      engine.global.set("__playground_read", read);
      await engine.doString(PRELUDE);
    },

    async run(code: string) {
      try {
        await engine.callByteCode((thread: any) =>
          thread.loadString(code, "@main.lua"),
        );
        return 0;
      } catch (error) {
        const text = String(
          error instanceof Error ? error.message : error,
        ).trim();
        const [first, ...rest] = text.split("\n");
        const match = /^main\.lua:(\d+):\s*(.*)$/.exec(first);
        host.reportError({
          name: "",
          message: match ? match[2] : first,
          stack: rest.join("\n").trim() || undefined,
          line: match ? Number(match[1]) : undefined,
        });
        return 1;
      }
    },
  };
}
