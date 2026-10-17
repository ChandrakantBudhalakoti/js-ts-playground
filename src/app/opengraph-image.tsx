import { ImageResponse } from "next/og";
import { OG_IMAGE_ALT, SITE_NAME } from "@/lib/site";

// Generated at build time. The same image is used by every page (see
// OG_IMAGE in src/lib/metadata.ts); Twitter/X falls back to it as well.
export const alt = OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CODE_LINES: [string, string][] = [
  ["#c792ea", "interface User { name: string }"],
  ["#82aaff", "const greet = (user: User) => `Hi, ${user.name}!`;"],
  ["#c3e88d", 'console.log(greet({ name: "Ada" }));'],
];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#121316",
        color: "#f5f5f5",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 14,
            background: "#ebebeb",
            color: "#121316",
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          {"{}"}
        </div>
        <div style={{ fontSize: 36, fontWeight: 600 }}>{SITE_NAME}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          Write and Run JavaScript & TypeScript Online
        </div>
        <div style={{ fontSize: 30, color: "#a3a3a3" }}>
          Monaco editor · Type checking · Sandboxed console · Share links
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "24px 28px",
          borderRadius: 16,
          background: "#1c1d21",
          border: "1px solid #2c2d33",
          fontSize: 26,
        }}
      >
        {CODE_LINES.map(([color, text]) => (
          <div key={text} style={{ display: "flex", color }}>
            {text}
          </div>
        ))}
        <div style={{ display: "flex", color: "#34d399" }}>{"> Hi, Ada!"}</div>
      </div>
    </div>,
    size,
  );
}
