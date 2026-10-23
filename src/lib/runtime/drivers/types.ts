/**
 * The contract between the sandbox's runtime worker and a language driver.
 *
 * Drivers are serialized with `Function.prototype.toString` into the worker
 * script, so each driver function must be self-contained: no imports (other
 * than types), no module-level helpers or constants.
 */

export interface OutputStream {
  /** Text exactly as the program wrote it (newlines included). */
  write(text: string): void;
  /** UTF-8 bytes; split multi-byte characters are joined across calls. */
  writeBytes(bytes: Uint8Array): void;
}

export interface DriverError {
  name: string;
  message: string;
  /** Frames from the user's file, formatted like the language does. */
  stack?: string;
  /** One-based position in the user's file. */
  line?: number;
  column?: number;
}

export interface DriverHost {
  /**
   * Virtual URL of the runtime's files (`https://….invalid/<runtime>/`).
   * `fetch` and `XMLHttpRequest` answer requests below it from the files
   * the app sent; every other request fails, as the sandbox has no network.
   */
  readonly baseUrl: string;
  /** A runtime file. Throws if it was not sent. */
  file(name: string): Uint8Array;
  text(name: string): string;
  /** Names of all runtime files. */
  fileNames(): string[];
  /** Add or replace a runtime file (served at its virtual URL from now on). */
  putFile(name: string, contents: Uint8Array | string): void;
  /**
   * Import a runtime file as an ES module. Classic and UMD scripts work too:
   * they set their globals. `import.meta.url` is rewritten to the file's
   * virtual URL, as blob: URLs cannot resolve relative paths.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importModule(name: string): Promise<any>;
  /** Source of a runtime file with `import.meta.url` rewritten (see importModule). */
  moduleSource(name: string): string;
  stdout: OutputStream;
  stderr: OutputStream;
  /**
   * Up to `max` bytes of standard input; empty at end of input. Call it only
   * when the program reads: reading an empty input is reported to the user.
   */
  readStdin(max: number): Uint8Array;
  /** The rest of standard input (see readStdin). */
  readAllStdin(): Uint8Array;
  /** All of standard input, for runtimes that hand it to the program up front. */
  stdinBytes(): Uint8Array;
  reportError(error: DriverError): void;
}

export interface Driver {
  /** Load the runtime. Output written while booting is discarded. */
  boot(): Promise<void>;
  /**
   * Run the user's program once. Resolves with its exit status, if the
   * language has one. Throwing reports the error as uncaught.
   */
  run(code: string, binary: Uint8Array | null): Promise<number | void>;
}

export type DriverFactory = (host: DriverHost) => Driver;
