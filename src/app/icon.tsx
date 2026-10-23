import { appIcon } from "@/lib/app-icon";

// Generated at build time: /icon/192, /icon/512 and the maskable /icon/maskable,
// for browser tabs, the web manifest and "Add to Home Screen".
export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
    {
      id: "maskable",
      size: { width: 512, height: 512 },
      contentType: "image/png",
    },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const which = await id;
  if (which === "maskable") return appIcon(512, { maskable: true });
  return appIcon(Number(which));
}
