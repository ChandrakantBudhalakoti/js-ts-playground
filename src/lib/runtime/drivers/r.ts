import type { Driver, DriverHost } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * R via webR. Self-contained (see ./types.ts).
 *
 * webR runs R in a worker of its own, created from its webr-worker.js
 * script. The driver prepends a small shim to that script and sends the R
 * files to the new worker as its first message, so R loads (and lazily
 * mounts its library files) from memory instead of the network.
 */
export function rDriver(host: DriverHost): Driver {
  /**
   * Runs at the top of webR's worker. Self-contained: inserted as source.
   * Serves fetch, XMLHttpRequest and importScripts for `base` from the files
   * received in the first message; everything else fails.
   */
  function innerNetwork(base: string) {
    const scope = self as any;
    const files = new Map<string, Uint8Array>();
    const blobs = new Map<string, string>();
    const decoder = new TextDecoder();
    scope.addEventListener("message", (event: any) => {
      const sent = event.data?.__playgroundFiles;
      if (!sent) return;
      event.stopImmediatePropagation();
      for (const [name, buffer] of Object.entries(sent))
        files.set(name, new Uint8Array(buffer as ArrayBuffer));
    });
    const fileOf = (url: unknown) => {
      let href: string;
      try {
        href = new URL(String(url), base).href;
      } catch {
        return null;
      }
      if (!href.startsWith(base)) return null;
      const name = decodeURIComponent(href.slice(base.length).split(/[?#]/)[0]);
      return files.has(name) ? name : null;
    };
    const offline = () =>
      new TypeError("Network access is disabled in the playground sandbox.");
    scope.fetch = (input: any) => {
      const name = fileOf(
        typeof input === "string" || input instanceof URL ? input : input?.url,
      );
      if (name === null) return Promise.reject(offline());
      return Promise.resolve(
        new Response(files.get(name) as BlobPart, {
          headers: {
            "Content-Type": name.endsWith(".wasm")
              ? "application/wasm"
              : "application/octet-stream",
          },
        }),
      );
    };
    const nativeImportScripts = scope.importScripts.bind(scope);
    scope.importScripts = (...urls: unknown[]) => {
      for (const url of urls) {
        const name = fileOf(url);
        if (name === null) throw offline();
        let blob = blobs.get(name);
        if (!blob) {
          blob = URL.createObjectURL(
            new Blob([files.get(name) as BlobPart], {
              type: "text/javascript",
            }),
          );
          blobs.set(name, blob);
        }
        nativeImportScripts(blob);
      }
    };
    function Request(this: any) {
      this.readyState = 0;
      this.status = 0;
      this.response = null;
      this.responseText = "";
      this.responseType = "";
      this.onload = null;
      this.onerror = null;
      this.onreadystatechange = null;
      this.url = "";
      this.async = true;
    }
    Request.prototype = {
      open(_method: string, url: string, async?: boolean) {
        this.url = String(url);
        this.async = async !== false;
        this.readyState = 1;
      },
      setRequestHeader() {},
      overrideMimeType() {},
      abort() {},
      getResponseHeader(header: string) {
        const name = this.status === 200 ? fileOf(this.url) : null;
        if (name !== null && header.toLowerCase() === "content-length")
          return String(files.get(name)!.length);
        return null;
      },
      getAllResponseHeaders() {
        return "";
      },
      addEventListener(type: string, listener: () => void) {
        this[`on${type}`] = listener;
      },
      send() {
        const name = fileOf(this.url);
        const finish = () => {
          this.readyState = 4;
          if (name === null) {
            this.onreadystatechange?.();
            this.onerror?.();
            return;
          }
          const data = files.get(name)!;
          this.status = 200;
          if (this.responseType === "arraybuffer")
            this.response = data.slice().buffer;
          else {
            this.responseText = decoder.decode(data);
            this.response = this.responseText;
          }
          this.onreadystatechange?.();
          this.onload?.();
        };
        if (this.async) setTimeout(finish, 0);
        else finish();
      },
    };
    scope.XMLHttpRequest = Request;
  }

  // Evaluates main.R like Rscript: each top-level expression in turn,
  // printing visible values, stopping at the first error. Warnings are shown
  // as they happen. Returns "status<US>line<US>call<US>message".
  const RUNNER = String.raw`
(function() {
  sep <- "\x1f"
  exprs <- tryCatch(
    parse(text = .playground_code, keep.source = TRUE, srcfile = srcfilecopy("main.R", .playground_code)),
    error = function(e) e
  )
  if (inherits(exprs, "error")) {
    # "main.R:2:3: unexpected symbol ..."
    message <- conditionMessage(exprs)
    line <- suppressWarnings(as.integer(strsplit(message, ":", fixed = TRUE)[[1]][2]))
    message <- sub("^main\\.R:[0-9]+:[0-9]+: ", "", message)
    return(paste("error", if (is.na(line)) "" else line, "", message, sep = sep))
  }
  refs <- attr(exprs, "srcref")
  for (i in seq_along(exprs)) {
    result <- tryCatch(
      withCallingHandlers(
        withVisible(eval(exprs[[i]], envir = globalenv())),
        warning = function(w) {
          message("Warning: ", conditionMessage(w))
          invokeRestart("muffleWarning")
        }
      ),
      error = function(e) e
    )
    if (inherits(result, "error")) {
      call <- conditionCall(result)
      call <- if (is.null(call)) "" else paste(deparse(call, nlines = 1L), collapse = "")
      return(paste("error", refs[[i]][1], call, conditionMessage(result), sep = sep))
    }
    if (result$visible) print(result$value)
  }
  paste("ok", "", "", "", sep = sep)
})()
`;

  let webR: any = null;

  function forward(message: any) {
    if (message?.type === "stdout") host.stdout.write(`${message.data}\n`);
    else if (message?.type === "stderr") host.stderr.write(`${message.data}\n`);
  }

  return {
    async boot() {
      host.putFile(
        "webr-worker.js",
        `(${innerNetwork.toString()})(${JSON.stringify(host.baseUrl)});\n${host.text("webr-worker.js")}`,
      );
      const scope = globalThis as any;
      const names = host
        .fileNames()
        .filter((name) => name !== "webr.mjs" && name !== "webr-worker.js");
      const NativeWorker = scope.Worker;
      // webR creates exactly one worker: give it the files before anything else.
      scope.Worker = class extends NativeWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          const sent: Record<string, ArrayBuffer> = {};
          for (const name of names) sent[name] = host.file(name).slice().buffer;
          this.postMessage({ __playgroundFiles: sent }, Object.values(sent));
        }
      };
      // webR resolves its URL against `location.origin`, which is "null" (not
      // a valid base URL) in the sandbox's opaque origin.
      host.putFile(
        "webr.mjs",
        host
          .text("webr.mjs")
          .replace(
            /new URL\((\w+),location\.origin\)/,
            "new URL($1,location.href)",
          ),
      );
      const { WebR, ChannelType } = await host.importModule("webr.mjs");
      webR = new WebR({
        baseUrl: host.baseUrl,
        channelType: ChannelType.PostMessage,
        interactive: false,
      });
      await webR.init();
      // Drop the startup banner.
      await webR.flush();
    },

    async run(code: string) {
      let running = true;
      void (async () => {
        while (running) forward(await webR.read());
      })();
      let result: string;
      try {
        result = await webR.evalRString(RUNNER, {
          env: { ".playground_code": code },
          captureStreams: false,
          captureConditions: false,
        });
      } finally {
        running = false;
        for (const message of await webR.flush()) forward(message);
      }
      const [status, line, call, message] = result.split("\x1f");
      if (status !== "error") return 0;
      // Reads like R's own "Error in f() : message".
      host.reportError({
        name: call ? `Error in ${call}` : "Error",
        message,
        line: line ? Number(line) : undefined,
      });
      return 1;
    },
  };
}
