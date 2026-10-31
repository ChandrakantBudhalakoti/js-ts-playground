"use client";

import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Language, Level } from "@/types/playground";
import { PlaygroundLink } from "./PlaygroundLink";

export interface BrowserItem {
  id: string;
  title: string;
  description: string;
  language: Language;
  level: Level;
  /** A page that explains it (a program page or a guide). */
  page?: string;
  /** Opens it in the playground. */
  playground: string;
}

interface Option<T extends string> {
  id: T;
  name: string;
}

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T | "all">[];
  value: T | "all";
  onChange: (value: T | "all") => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin]"
    >
      <span className="w-16 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "h-9 shrink-0 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors pointer-coarse:h-10",
            value === option.id
              ? "border-foreground bg-foreground text-background"
              : "hover:bg-muted",
          )}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
}

/**
 * Every example, filterable by language and level. All of them are in the
 * server-rendered page (for search engines); filtering only hides some.
 */
export function ExampleBrowser({
  items,
  languages,
  levels,
}: {
  items: BrowserItem[];
  languages: Option<Language>[];
  levels: Option<Level>[];
}) {
  const [language, setLanguage] = useState<Language | "all">("all");
  const [level, setLevel] = useState<Level | "all">("all");
  const levelName = new Map(levels.map((option) => [option.id, option.name]));
  const visible = items.filter(
    (item) =>
      (language === "all" || item.language === language) &&
      (level === "all" || item.level === level),
  );

  return (
    <div>
      <div className="space-y-2 rounded-xl border p-3 sm:p-4">
        <FilterRow
          label="Language"
          options={[{ id: "all", name: "All" }, ...languages]}
          value={language}
          onChange={setLanguage}
        />
        <FilterRow
          label="Level"
          options={[{ id: "all", name: "All" }, ...levels]}
          value={level}
          onChange={setLevel}
        />
      </div>
      <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
        {visible.length === 1 ? "1 example" : `${visible.length} examples`}
      </p>

      {languages.map((option) => {
        const group = visible.filter((item) => item.language === option.id);
        if (group.length === 0) return null;
        return (
          <section
            key={option.id}
            id={option.id}
            aria-labelledby={`${option.id}-examples`}
            className="scroll-mt-6 pt-8"
          >
            <h2
              id={`${option.id}-examples`}
              className="text-xl font-semibold tracking-tight"
            >
              {option.name} examples
            </h2>
            <ul className="mt-4 divide-y rounded-xl border">
              {group.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.description}
                      <span className="ml-2 inline-block rounded-full border px-2 text-xs">
                        {levelName.get(item.level)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-sm">
                    {item.page && (
                      <Link
                        href={item.page}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                        aria-label={`Explained: ${item.title} (${option.name})`}
                      >
                        Explained
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    )}
                    <PlaygroundLink
                      href={item.playground}
                      className="inline-flex items-center gap-1.5 font-medium hover:underline"
                      aria-label={`Open “${item.title}” (${option.name}) in the playground`}
                    >
                      <Play className="size-3.5 fill-current" aria-hidden />
                      Open
                    </PlaygroundLink>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
