import { SITE_NAME } from "@/lib/site";

/**
 * Shown when one of the site's own scripts fails to download, for example
 * while the server is overloaded or the connection drops.
 */
const MESSAGE = `Some of ${SITE_NAME}'s files didn't download, so parts of the page may not work. Your code is saved in this browser.`;

/**
 * Runs as an inline script at the top of every page, before React: if a
 * script of the page fails to download, the page may never become
 * interactive, and nothing would tell the user why. A notice with a Reload
 * button is shown instead. Monaco's loader uses script elements too, so a
 * missing editor feature is reported the same way.
 *
 * Self-contained: serialized with `Function.prototype.toString`, so it must
 * not reference imports or module-level identifiers.
 */
function watchLoadFailures(message: string) {
  let shown = false;

  function show() {
    if (shown) return;
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", show, { once: true });
      return;
    }
    shown = true;
    const notice = document.createElement("div");
    notice.setAttribute("role", "alert");
    notice.dataset.testid = "load-failure";
    notice.style.cssText =
      "position:fixed;z-index:2147483647;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));max-width:36rem;margin:0 auto;display:flex;align-items:center;gap:12px;padding:10px 12px 10px 14px;border:1px solid #f59e0b;border-radius:10px;background:#fef3c7;color:#451a03;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    const text = document.createElement("span");
    text.style.flex = "1";
    text.textContent = message;
    const reload = document.createElement("button");
    reload.type = "button";
    reload.textContent = "Reload";
    reload.style.cssText =
      "min-height:44px;padding:0 16px;border:0;border-radius:8px;background:#451a03;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer";
    // Not an inline onclick: the CSP blocks those (script-src-attr 'none').
    reload.addEventListener("click", () => location.reload());
    notice.append(text, reload);
    document.body.append(notice);
  }

  // Load errors do not bubble: listen in the capture phase.
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLScriptElement) || !target.src) return;
      try {
        if (new URL(target.src).origin !== location.origin) return;
      } catch {
        return;
      }
      show();
    },
    true,
  );
}

/** The inline script for the root layout's `<head>`. */
export const LOAD_FAILURE_SCRIPT = `(${watchLoadFailures.toString()})(${JSON.stringify(MESSAGE)});`;
