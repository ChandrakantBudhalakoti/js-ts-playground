# Java runtime files

Java runs in the browser with [TeaVM](https://teavm.org)'s in-browser
compiler ([teavm-javac](https://github.com/konsoletyper/teavm-javac)): OpenJDK's
`javac` and TeaVM in one WebAssembly module. `javac` turns the program into
class files, and TeaVM turns those into a WebAssembly module (WasmGC, so a
recent browser: Chrome 119, Firefox 120, Safari 18.2 or newer), which runs in
the sandbox. `scripts/prepare-assets.mjs` publishes these files like the
other runtimes (`src/lib/runtime/runtime-assets.json`, id `java`), and
`src/lib/runtime/drivers/java.ts` drives them.

TeaVM publishes no package for this, so the files live here.

## Files

| File                           | From                                                      | SHA-256                                                            |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `compiler.wasm`                | https://teavm.org/playground/3/compiler.wasm              | `7f3828e4b7bddf5504dadebfc4016e40f4441e15ee0519071781813ba2ed3a4c` |
| `compiler.wasm-runtime.js`     | https://teavm.org/playground/3/compiler.wasm-runtime.js   | `9ff6a6771f698be00ab9d5c7b46d904350a8d4115dc0b409553f31ed66688a55` |
| `runtime-classlib-teavm.bin`   | https://teavm.org/playground/3/runtime-classlib-teavm.bin | `ea670e71967eda93828cb894c1741a8ed2e94b3422eb99cb9eccec0de67daaa8` |
| `sdk.bin`, `extra-classes.bin` | `node runtimes/java/build-support.mjs` (needs a JDK 21+)  |                                                                    |
| `src/`                         | Ours: the classes TeaVM lacks (`Scanner`)                 |                                                                    |

- **`sdk.bin`** is the Java 21 API (`java.base`) that `javac` compiles
  against, built from a JDK's `lib/ct.sym`. TeaVM's own
  `compile-classlib-teavm.bin` is not used: with it, `javac` cannot find
  inherited methods such as `getMessage()` and `getClass()`.
- **`extra-classes.bin`** holds `java.util.Scanner` and
  `InputMismatchException`, which TeaVM's class library lacks, written in
  TeaVM's naming (`org.teavm.classlib.java.util.TScanner` is
  `java.util.Scanner` to a program). The driver adds them to every program.
  `Scanner` reads the Input tab from the `codetakhti.stdin` system property,
  which the driver's launcher sets.

## Known gaps (TeaVM's WebAssembly backend)

- `printf` and `String.format` with `%f` fail inside TeaVM's `DecimalFormat`
  (`%d` and `%s` work).
- `BufferedReader(new InputStreamReader(System.in))` does not compile
  (`InputStreamReader` is unsupported there); `Scanner` works.
- Indexing past the end of an array stops the program (a WebAssembly trap)
  instead of throwing an `ArrayIndexOutOfBoundsException` that `catch` can
  handle.

The driver reports these with an explanation instead of the raw error.

## Licenses

TeaVM and teavm-javac: Apache License 2.0 (`LICENSE-teavm.txt`). The `javac`
inside `compiler.wasm` and the API signatures in `sdk.bin` come from OpenJDK:
GPL v2 with the Classpath Exception (`LICENSE-openjdk-gpl2-classpath-exception.txt`).
The rest of this folder is MIT, like the project.

## Updating

Download the three TeaVM files again (check their hashes changed on purpose),
run `node runtimes/java/build-support.mjs`, bump `version` for `java` in
`src/lib/runtime/runtime-assets.json`, and run the Java tests
(`tests/e2e/languages.spec.ts`, `tests/e2e/programs.spec.ts`).
