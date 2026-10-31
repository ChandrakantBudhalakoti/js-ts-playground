"use client";

import type * as MonacoNamespace from "monaco-editor";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/hooks/useLocale";
import { type MessageKey, t } from "@/lib/i18n";
import type { Monaco, MonacoEditor } from "@/lib/monaco/setup";

type IPosition = MonacoNamespace.IPosition;
type IRange = MonacoNamespace.IRange;

/** How long a finger rests on the code before it selects the word under it. */
const LONG_PRESS_MS = 450;
/** A finger that moves further than this first is scrolling, not pressing. */
const TOUCH_SLOP_PX = 10;
/** Dragging the selection this close to the top or bottom edge scrolls. */
const EDGE_PX = 40;
/** Room the handle knobs take below the last selected line. */
const KNOB_SPACE_PX = 28;
/** Space between the menu and the selection or the editor's edges. */
const GAP_PX = 8;

/**
 * Monaco's touch gestures on the code (vs/base/browser/touch.ts): a tap
 * places the cursor, a drag scrolls, a long press opens its context menu.
 */
const MONACO_GESTURES = [
  "-monaco-gesturetap",
  "-monaco-gesturechange",
  "-monaco-gesturecontextmenu",
];

/** A caret's box, relative to the overlay. */
interface Caret {
  left: number;
  top: number;
  height: number;
}

interface SelectionView {
  /** The ends of the selection, or null while scrolled out of view. */
  start: Caret | null;
  end: Caret | null;
  /** Nothing selected: a long press on blank space shows the menu there. */
  empty: boolean;
  /** A finger is adjusting the selection (the menu waits until it lifts). */
  dragging: boolean;
}

type Drag =
  // A long press, then moving the finger without lifting it.
  | { kind: "press"; range: IRange }
  // A handle; dx/dy keep the finger where it took hold of the handle.
  | { kind: "handle"; anchor: IPosition; dx: number; dy: number };

type Controller = ReturnType<typeof createController>;

interface MenuItem {
  label: MessageKey;
  /** Resolves to true when it worked. */
  run: (controller: Controller) => unknown;
  needsSelection: boolean;
  /** Shown in place of the label for a moment once it worked. */
  done?: MessageKey;
}

const MENU: MenuItem[] = [
  { label: "selection.cut", run: (c) => c.cut(), needsSelection: true },
  {
    label: "selection.copy",
    run: (c) => c.copy(),
    needsSelection: true,
    done: "selection.copied",
  },
  { label: "selection.paste", run: (c) => c.paste(), needsSelection: false },
  {
    label: "selection.selectAll",
    run: (c) => c.selectAll(),
    needsSelection: false,
  },
];

/**
 * Text selection with a finger, which Monaco lacks: it cancels the browser's
 * own (its touch handling prevents the default of every touch on the code)
 * and only places the cursor or scrolls. A long press selects a word, and
 * moving the finger without lifting it extends the selection; handles at
 * both ends adjust it, and a menu copies, cuts and pastes.
 */
function createController(
  editor: MonacoEditor,
  monaco: Monaco,
  overlay: HTMLElement,
  onView: (view: SelectionView | null) => void,
) {
  const dom = editor.getDomNode()!;
  let drag: Drag | null = null;
  let point = { x: 0, y: 0 };
  let press: { x: number; y: number; timer: number } | null = null;
  // Set by a long press: Monaco's gestures for the rest of that touch (the
  // scroll, and the tap or context menu on release) are dropped.
  let swallow = false;
  let caretMenu = false;
  let applying = false;
  let frame = 0;

  function show() {
    const selection = editor.getSelection();
    if (!selection || (selection.isEmpty() && !caretMenu)) return onView(null);
    const inView = editor
      .getVisibleRanges()
      .some((range) =>
        monaco.Range.areIntersectingOrTouching(range, selection),
      );
    if (!inView) return onView(null);
    const layout = editor.getLayoutInfo();
    const outer = dom.getBoundingClientRect();
    const inner = overlay.getBoundingClientRect();
    const caret = (position: IPosition): Caret | null => {
      const box = editor.getScrolledVisiblePosition(position);
      if (
        !box ||
        box.top + box.height <= 0 ||
        box.top >= layout.height ||
        box.left < layout.contentLeft - 1 ||
        box.left > layout.contentLeft + layout.contentWidth
      )
        return null;
      return {
        left: box.left + outer.left - inner.left,
        top: box.top + outer.top - inner.top,
        height: box.height,
      };
    };
    onView({
      start: caret(selection.getStartPosition()),
      end: caret(selection.getEndPosition()),
      empty: selection.isEmpty(),
      dragging: drag !== null,
    });
  }

  /** Select from `anchor` to `active`, marked as this module's own change. */
  function select(anchor: IPosition, active: IPosition) {
    applying = true;
    try {
      editor.setSelection(
        new monaco.Selection(
          anchor.lineNumber,
          anchor.column,
          active.lineNumber,
          active.column,
        ),
      );
    } finally {
      applying = false;
    }
  }

  /** The position under a point, which is kept inside the code area. */
  function positionAt(x: number, y: number) {
    const layout = editor.getLayoutInfo();
    const rect = dom.getBoundingClientRect();
    const left = rect.left + layout.contentLeft;
    const clampedX = Math.min(
      Math.max(x, left + 1),
      left + layout.contentWidth - 1,
    );
    const clampedY = Math.min(
      Math.max(y, rect.top + 1),
      rect.top + layout.height - 1,
    );
    return editor.getTargetAtClientPoint(clampedX, clampedY)?.position ?? null;
  }

  /** Move the end of the selection being dragged to the finger. */
  function track() {
    if (!drag) return;
    const handle = drag.kind === "handle" ? drag : null;
    const position = positionAt(
      point.x - (handle?.dx ?? 0),
      point.y - (handle?.dy ?? 0),
    );
    if (!position) return;
    if (drag.kind === "press") {
      // The pressed word stays selected; the finger extends it either way.
      const { range } = drag;
      const start = monaco.Range.getStartPosition(range);
      const end = monaco.Range.getEndPosition(range);
      if (monaco.Position.isBefore(position, start)) select(end, position);
      else if (monaco.Position.isBefore(end, position)) select(start, position);
      else select(start, end);
    } else if (!monaco.Position.equals(position, drag.anchor)) {
      // Never empty: the handles would disappear under the finger.
      select(drag.anchor, position);
    }
  }

  function move(x: number, y: number) {
    point = { x, y };
    track();
    frame ||= requestAnimationFrame(autoScroll);
  }

  /** While the finger is near the top or bottom edge, scroll and extend. */
  function autoScroll() {
    frame = 0;
    if (!drag) return;
    const rect = dom.getBoundingClientRect();
    const y = point.y - (drag.kind === "handle" ? drag.dy : 0);
    const depth =
      y < rect.top + EDGE_PX
        ? y - rect.top - EDGE_PX
        : y > rect.bottom - EDGE_PX
          ? y - rect.bottom + EDGE_PX
          : 0;
    if (!depth) return;
    const before = editor.getScrollTop();
    editor.setScrollTop(
      before + Math.max(-EDGE_PX, Math.min(EDGE_PX, depth)) / 2,
    );
    if (editor.getScrollTop() === before) return;
    track();
    frame = requestAnimationFrame(autoScroll);
  }

  function endDrag() {
    if (!drag) return;
    drag = null;
    cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener("pointermove", onHandleMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    show();
  }

  function cancelPress() {
    if (press) clearTimeout(press.timer);
    press = null;
  }

  function longPress() {
    press = null;
    const target = editor.getTargetAtClientPoint(point.x, point.y);
    const model = editor.getModel();
    if (!target?.position || !model) return;
    const { position } = target;
    // Text selects its word; blank space (past the end of a line, or
    // between words) offers to paste there.
    const word =
      target.type === monaco.editor.MouseTargetType.CONTENT_TEXT
        ? model.getWordAtPosition(position)
        : null;
    const range = word
      ? new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn,
        )
      : monaco.Range.fromPositions(position);
    swallow = true;
    caretMenu = !word;
    drag = { kind: "press", range };
    select(range.getStartPosition(), range.getEndPosition());
    show();
  }

  function onTouchStart(event: TouchEvent) {
    swallow = false;
    cancelPress();
    if (event.touches.length !== 1) return endDrag();
    const target = event.target;
    if (
      !(target instanceof Element) ||
      !target.closest(".lines-content") ||
      target.closest(".contentWidgets")
    )
      return;
    const { clientX: x, clientY: y } = event.touches[0];
    point = { x, y };
    press = { x, y, timer: window.setTimeout(longPress, LONG_PRESS_MS) };
  }

  function onTouchMove(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch) return;
    if (press) {
      point = { x: touch.clientX, y: touch.clientY };
      if (Math.hypot(point.x - press.x, point.y - press.y) > TOUCH_SLOP_PX)
        cancelPress();
    }
    if (drag?.kind === "press") {
      event.preventDefault();
      move(touch.clientX, touch.clientY);
    }
  }

  function onTouchEnd() {
    cancelPress();
    if (drag?.kind === "press") endDrag();
  }

  function onGesture(event: Event) {
    // Capturing on an ancestor of the lines runs before Monaco's listeners.
    if (swallow) event.stopPropagation();
  }

  function onContextMenu(event: Event) {
    if (swallow) event.preventDefault();
  }

  function onHandleMove(event: PointerEvent) {
    if (drag?.kind === "handle") move(event.clientX, event.clientY);
  }

  dom.addEventListener("touchstart", onTouchStart, {
    capture: true,
    passive: true,
  });
  // Not passive: while selecting, the finger must not scroll the page.
  dom.addEventListener("touchmove", onTouchMove, {
    capture: true,
    passive: false,
  });
  dom.addEventListener("touchend", onTouchEnd, true);
  dom.addEventListener("touchcancel", onTouchEnd, true);
  dom.addEventListener("contextmenu", onContextMenu, true);
  for (const type of MONACO_GESTURES)
    dom.addEventListener(type, onGesture, true);
  const subscriptions = [
    editor.onDidChangeCursorSelection(() => {
      if (!applying) caretMenu = false;
      show();
    }),
    editor.onDidScrollChange(show),
    editor.onDidLayoutChange(show),
  ];

  async function writeClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      toast.error(t("selection.copyFailed"));
      return false;
    }
  }

  return {
    startHandle(event: PointerEvent, side: "start" | "end") {
      const selection = editor.getSelection();
      if (!selection) return;
      const moving =
        side === "start"
          ? selection.getStartPosition()
          : selection.getEndPosition();
      const box = editor.getScrolledVisiblePosition(moving);
      if (!box) return;
      const rect = dom.getBoundingClientRect();
      drag = {
        kind: "handle",
        anchor:
          side === "start"
            ? selection.getEndPosition()
            : selection.getStartPosition(),
        dx: event.clientX - (rect.left + box.left),
        dy: event.clientY - (rect.top + box.top + box.height / 2),
      };
      point = { x: event.clientX, y: event.clientY };
      // On the window: the handle can scroll out of view and unmount.
      window.addEventListener("pointermove", onHandleMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
      show();
    },

    async copy() {
      const selection = editor.getSelection();
      const model = editor.getModel();
      if (!selection || !model || selection.isEmpty()) return false;
      return writeClipboard(model.getValueInRange(selection));
    },

    async cut() {
      const selection = editor.getSelection();
      const model = editor.getModel();
      if (!selection || !model || selection.isEmpty()) return;
      if (!(await writeClipboard(model.getValueInRange(selection)))) return;
      editor.pushUndoStop();
      editor.executeEdits("touch-selection", [{ range: selection, text: "" }]);
      editor.pushUndoStop();
    },

    async paste() {
      let text: string;
      try {
        text = await navigator.clipboard.readText();
      } catch {
        // Phone keyboards have a paste key of their own.
        toast.error(t("selection.pasteFailed"), {
          description: t("selection.pasteHint"),
        });
        editor.focus();
        return;
      }
      caretMenu = false;
      editor.pushUndoStop();
      editor.trigger("touch-selection", "paste", { text });
      editor.pushUndoStop();
    },

    selectAll() {
      const model = editor.getModel();
      if (!model) return;
      const range = model.getFullModelRange();
      select(range.getStartPosition(), range.getEndPosition());
    },

    dispose() {
      cancelPress();
      endDrag();
      dom.removeEventListener("touchstart", onTouchStart, true);
      dom.removeEventListener("touchmove", onTouchMove, true);
      dom.removeEventListener("touchend", onTouchEnd, true);
      dom.removeEventListener("touchcancel", onTouchEnd, true);
      dom.removeEventListener("contextmenu", onContextMenu, true);
      for (const type of MONACO_GESTURES)
        dom.removeEventListener(type, onGesture, true);
      for (const subscription of subscriptions) subscription.dispose();
    },
  };
}

/**
 * Selection handles and a Cut/Copy/Paste menu over the editor, for touch
 * screens. Rendered over the editor, in a positioned parent.
 */
export function TouchSelection({
  editor,
  monaco,
}: {
  editor: MonacoEditor;
  monaco: Monaco;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const [view, setView] = useState<SelectionView | null>(null);
  // Re-render when the interface language changes.
  useLocale();
  // The item that just worked shows it ("Copied") for a moment: on phones a
  // toast would cover the top of the code.
  const [done, setDone] = useState<string | null>(null);
  const doneTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(doneTimer.current), []);

  async function choose(item: MenuItem) {
    const instance = controller.current;
    if (!instance || (await item.run(instance)) !== true || !item.done) return;
    setDone(item.label);
    clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => setDone(null), 1500);
  }

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const instance = createController(editor, monaco, overlay, setView);
    controller.current = instance;
    return () => {
      instance.dispose();
      controller.current = null;
    };
  }, [editor, monaco]);

  // Above the selection, else below it (past the handles), else at the top;
  // centred on a one-line selection, kept inside the editor.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const overlay = overlayRef.current;
    if (!menu || !overlay || !view) return;
    const { offsetWidth: width, offsetHeight: height } = menu;
    const { clientWidth, clientHeight } = overlay;
    const above = (view.start?.top ?? 0) - height - GAP_PX;
    const below =
      (view.end ? view.end.top + view.end.height : clientHeight) +
      KNOB_SPACE_PX +
      GAP_PX;
    const top =
      above >= GAP_PX
        ? above
        : below + height <= clientHeight - GAP_PX
          ? below
          : GAP_PX;
    const center =
      view.start && view.end && view.start.top === view.end.top
        ? (view.start.left + view.end.left) / 2
        : (view.start?.left ?? clientWidth / 2);
    const left = Math.min(
      Math.max(center - width / 2, GAP_PX),
      clientWidth - width - GAP_PX,
    );
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }, [view]);

  const handle = (caret: Caret | null, side: "start" | "end") =>
    caret &&
    view &&
    !view.empty && (
      <div
        aria-hidden
        data-testid={`selection-handle-${side}`}
        className="pointer-events-auto absolute flex h-11 w-11 -translate-x-1/2 touch-none justify-center"
        style={{ left: caret.left, top: caret.top + caret.height }}
        onPointerDown={(event) => {
          // Keep the editor's focus (and the on-screen keyboard as it is).
          event.preventDefault();
          controller.current?.startHandle(event.nativeEvent, side);
        }}
      >
        <span
          className="pointer-events-none absolute bottom-full left-1/2 w-0.5 -translate-x-1/2 bg-blue-600 dark:bg-blue-400"
          style={{ height: caret.height }}
        />
        <span className="mt-0.5 size-5 rounded-full bg-blue-600 shadow-md dark:bg-blue-400" />
      </div>
    );

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0 z-10"
      data-testid="touch-selection"
    >
      {handle(view?.start ?? null, "start")}
      {handle(view?.end ?? null, "end")}
      {view && !view.dragging && (
        <div
          ref={menuRef}
          role="toolbar"
          aria-label={t("selection.toolbar")}
          data-testid="selection-menu"
          className="pointer-events-auto absolute flex divide-x overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md"
        >
          {MENU.filter((item) => !(view.empty && item.needsSelection)).map(
            (item) => (
              <button
                key={item.label}
                type="button"
                // Keep the editor's focus, as the code keys do.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => void choose(item)}
                className="h-10 px-3 text-sm font-medium whitespace-nowrap active:bg-muted"
              >
                {t(done === item.label && item.done ? item.done : item.label)}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
