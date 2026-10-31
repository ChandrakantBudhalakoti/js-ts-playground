import { Playground } from "@/components/playground/Playground";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Online Code Editor and Compiler",
  description:
    "Write and run Python, C, C++, Java, JavaScript, TypeScript, Go, Ruby, PHP, Lua or R in your browser, with an editor and console that work on phones and tablets.",
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
