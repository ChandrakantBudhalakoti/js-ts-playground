import { ImageResponse } from "next/og";

/** Colours of the app icon, also used by the web manifest. */
export const ICON_BACKGROUND = "#121316";
const ICON_FOREGROUND = "#f5f5f5";
const ICON_ACCENT = "#34d399";

/**
 * The app icon: braces on a dark slate with a green "run" underline.
 * `maskable` keeps everything inside the central 80% safe zone, which
 * Android crops to circles and other shapes.
 */
export function appIcon(size: number, { maskable = false } = {}) {
  const glyph = Math.round(size * (maskable ? 0.36 : 0.46));
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: ICON_BACKGROUND,
        borderRadius: maskable ? 0 : Math.round(size * 0.22),
        color: ICON_FOREGROUND,
        fontSize: glyph,
        fontWeight: 700,
        letterSpacing: -Math.round(glyph * 0.05),
      }}
    >
      {"{ }"}
      <div
        style={{
          width: Math.round(glyph * 1.1),
          height: Math.max(2, Math.round(size * 0.035)),
          marginTop: Math.round(size * 0.02),
          borderRadius: size,
          background: ICON_ACCENT,
        }}
      />
    </div>,
    { width: size, height: size },
  );
}
