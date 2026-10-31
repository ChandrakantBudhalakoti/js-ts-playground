import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  LEVELS,
  PROGRAM_TOPICS,
  PROGRAMS,
  programCode,
  programPath,
} from "@/lib/programs";
import type { Language } from "@/types/playground";

/** A language's beginner programs, grouped by topic, each linking to its page. */
export function ProgramList({
  language,
  headingLevel = 3,
}: {
  language: Language;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="space-y-8">
      {PROGRAM_TOPICS.map((topic) => {
        const programs = PROGRAMS.filter(
          (program) =>
            program.topic === topic && programCode(program, language),
        );
        if (programs.length === 0) return null;
        return (
          <section key={topic} aria-label={topic}>
            <Heading className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {topic}
            </Heading>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {programs.map((program) => (
                <li key={program.slug}>
                  <Link
                    href={programPath(program, language)}
                    className="group flex h-full items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span>
                      <span className="font-medium">{program.name}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {program.summary}
                        {program.level !== "beginner" &&
                          ` · ${LEVELS.find((level) => level.id === program.level)?.name}`}
                      </span>
                    </span>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
