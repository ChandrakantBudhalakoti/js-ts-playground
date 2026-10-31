// Builds the two files this folder adds to TeaVM's in-browser Java
// compiler (see README.md). Needs a JDK 21 or newer (`java`, `javac`).
//
//   sdk.bin            The Java 21 API that javac compiles against, from the
//                      JDK's lib/ct.sym. (TeaVM's own compile-classlib makes
//                      javac miss inherited methods such as getMessage().)
//   extra-classes.bin  Classes TeaVM's class library lacks (src/), compiled:
//                      java.util.Scanner and InputMismatchException.
//
// Both use the archive format TeaVM's compiler reads: gzip of repeated
// (u16 name length, UTF-8 name, u32 data length, data).
//
// Usage: node runtimes/java/build-support.mjs
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, inflateRawSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
/** ct.sym's folder letter for Java 21 (8, 9, A = 10, … L = 21). */
const RELEASE = "L";
/** Class-file version 65 (Java 21): the newest the embedded javac reads. */
const CLASS_VERSION = 65;

function javaHome() {
  // The JVM prints its settings on stderr.
  const { stderr } = spawnSync(
    "java",
    ["-XshowSettings:properties", "-version"],
    { encoding: "utf8" },
  );
  return /java\.home = (.+)/.exec(stderr ?? "")?.[1].trim();
}

/** The entries of a zip file (enough of the format for ct.sym). */
function* zipEntries(path) {
  const data = readFileSync(path);
  let end = data.length - 22;
  while (end >= 0 && data.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error(`${path} is not a zip file`);
  const count = data.readUInt16LE(end + 10);
  let entry = data.readUInt32LE(end + 16);
  for (let i = 0; i < count; i++) {
    const method = data.readUInt16LE(entry + 10);
    const compressed = data.readUInt32LE(entry + 20);
    const nameLength = data.readUInt16LE(entry + 28);
    const extraLength = data.readUInt16LE(entry + 30);
    const commentLength = data.readUInt16LE(entry + 32);
    const local = data.readUInt32LE(entry + 42);
    const name = data.toString("utf8", entry + 46, entry + 46 + nameLength);
    entry += 46 + nameLength + extraLength + commentLength;
    const start =
      local +
      30 +
      data.readUInt16LE(local + 26) +
      data.readUInt16LE(local + 28);
    const raw = data.subarray(start, start + compressed);
    yield { name, read: () => (method === 0 ? raw : inflateRawSync(raw)) };
  }
}

function archive(entries) {
  const parts = [];
  for (const [name, data] of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    const header = Buffer.alloc(2 + nameBytes.length + 4);
    header.writeUInt16BE(nameBytes.length, 0);
    nameBytes.copy(header, 2);
    header.writeUInt32BE(data.length, 2 + nameBytes.length);
    parts.push(header, data);
  }
  return gzipSync(Buffer.concat(parts), { level: 9 });
}

function withClassVersion(data) {
  const copy = Buffer.from(data);
  if (copy.readUInt32BE(0) !== 0xcafebabe) throw new Error("not a class file");
  copy.writeUInt16BE(CLASS_VERSION, 6);
  return copy;
}

function buildSdk(home) {
  const entries = [];
  const seen = new Set();
  for (const entry of zipEntries(join(home, "lib", "ct.sym"))) {
    const [releases, module, ...rest] = entry.name.split("/");
    if (!releases?.includes(RELEASE) || module !== "java.base") continue;
    if (!entry.name.endsWith(".sig")) continue;
    const name = `${rest.join("/").slice(0, -".sig".length)}.class`;
    if (seen.has(name)) continue;
    seen.add(name);
    entries.push([name, withClassVersion(entry.read())]);
  }
  entries.sort(([a], [b]) => (a < b ? -1 : 1));
  const bytes = archive(entries);
  writeFileSync(join(here, "sdk.bin"), bytes);
  console.log(`sdk.bin: ${entries.length} classes, ${bytes.length} bytes`);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function buildExtraClasses() {
  const out = mkdtempSync(join(tmpdir(), "java-support-"));
  try {
    const sources = walk(join(here, "src")).filter((path) =>
      path.endsWith(".java"),
    );
    execFileSync("javac", ["--release", "21", "-d", out, ...sources], {
      stdio: "inherit",
    });
    const entries = walk(out)
      .map((path) => [
        relative(out, path).replaceAll("\\", "/"),
        readFileSync(path),
      ])
      .sort(([a], [b]) => (a < b ? -1 : 1));
    const bytes = archive(entries);
    writeFileSync(join(here, "extra-classes.bin"), bytes);
    console.log(
      `extra-classes.bin: ${entries.map(([name]) => name).join(", ")}`,
    );
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

const home = javaHome();
if (!home) throw new Error("Could not find the JDK (is java on the PATH?)");
buildSdk(home);
buildExtraClasses();
