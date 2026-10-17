import { Playground } from "@/components/playground/Playground";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Online JavaScript & TypeScript Editor",
  description:
    "Open the JS/TS Playground editor: write JavaScript or TypeScript with autocomplete and live type checking, then run it in a sandbox and see the console output.",
  path: "/playground",
});

export default function PlaygroundPage() {
  return (
    <div data-playground>
      <Playground />
      <noscript>
        <p className="p-4 text-sm">
          The playground needs JavaScript to edit and run code. Please enable
          JavaScript in your browser.
        </p>
      </noscript>
    </div>
  );
}
