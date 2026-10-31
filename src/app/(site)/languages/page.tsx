import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { PlaygroundLink } from "@/components/site/PlaygroundLink";
import { Section } from "@/components/site/Section";
import { DEFAULT_EXAMPLE, playgroundHref } from "@/lib/examples";
import { LANGUAGE_GROUPS, LANGUAGES } from "@/lib/languages";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Programming Languages You Can Run Online",
  description:
    "Run JavaScript, TypeScript, Python, C, C++, Java, Go, Ruby, PHP, Lua and R online, free, in your browser on a phone, tablet or computer. See what each one supports.",
  path: "/languages",
});

export default function LanguagesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <PageHeader
        heading="Programming Languages You Can Run Online"
        lead={
          <p>
            Ten languages, each running in your browser on its real compiler or
            interpreter, built for WebAssembly. Nothing to install and nothing
            sent to a server: pick one and start coding, on a phone as well as a
            laptop.
          </p>
        }
      />

      {LANGUAGE_GROUPS.map((group) => (
        <Section key={group.id} id={group.id} heading={group.label}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {LANGUAGES.filter((info) => info.group === group.id).map((info) => (
              <li
                key={info.id}
                className="flex flex-col gap-3 rounded-xl border p-5"
              >
                <div>
                  <h3 className="font-medium">
                    <Link
                      href={info.path}
                      className="inline-flex items-center gap-1.5 hover:underline"
                    >
                      {info.name}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {info.engine}
                    {info.download
                      ? `. First run downloads about ${info.download}.`
                      : "."}
                  </p>
                </div>
                <PlaygroundLink
                  href={playgroundHref(DEFAULT_EXAMPLE[info.id].id)}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  <Play className="size-3.5 fill-current" aria-hidden />
                  {/* The name starts with the visible text (WCAG 2.5.3), so
                      voice control users can say what they see. */}
                  Open in the playground
                  <span className="sr-only"> ({info.name})</span>
                </PlaygroundLink>
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </div>
  );
}
