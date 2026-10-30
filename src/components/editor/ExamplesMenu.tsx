"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EXAMPLES, findExample, isProgramExample } from "@/lib/examples";
import { isJavaScriptLike, LANGUAGES, languageInfo } from "@/lib/languages";
import {
  PROGRAM_TOPICS,
  programCode,
  programExampleId,
  PROGRAMS,
} from "@/lib/programs";
import type { CodeExample, Language } from "@/types/playground";

interface ExamplesMenuProps {
  /** Examples in this language are listed first. */
  language: Language;
  onSelect: (example: CodeExample) => void;
}

function ExampleItem({
  example,
  onSelect,
}: {
  example: CodeExample;
  onSelect: (example: CodeExample) => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={() => onSelect(example)}
      className="flex-col items-start gap-0"
    >
      <span className="text-sm">{example.title}</span>
      <span className="text-xs text-muted-foreground">
        {example.description}
      </span>
    </DropdownMenuItem>
  );
}

function ExampleGroup({
  language,
  onSelect,
  onBrowsePrograms,
}: {
  language: Language;
  onSelect: (example: CodeExample) => void;
  onBrowsePrograms: (language: Language) => void;
}) {
  const programs = programsIn(language);
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        {languageInfo(language).name}
      </DropdownMenuLabel>
      {EXAMPLES.filter(
        (e) => e.language === language && !isProgramExample(e),
      ).map((example) => (
        <ExampleItem key={example.id} example={example} onSelect={onSelect} />
      ))}
      {programs.length > 0 && (
        <DropdownMenuItem
          // Stay open and list the programs in the same panel.
          onSelect={(event) => {
            event.preventDefault();
            onBrowsePrograms(language);
          }}
        >
          <GraduationCap aria-hidden />
          Beginner programs ({programs.length})
          <ChevronRight className="ml-auto opacity-60" aria-hidden />
        </DropdownMenuItem>
      )}
    </DropdownMenuGroup>
  );
}

/** A language's beginner programs (src/lib/programs), in syllabus order. */
function programsIn(language: Language) {
  return PROGRAMS.flatMap((program) => {
    const example = programCode(program, language)
      ? findExample(programExampleId(program, language))
      : undefined;
    return example ? [{ program, example }] : [];
  });
}

function ProgramGroups({
  language,
  onSelect,
}: {
  language: Language;
  onSelect: (example: CodeExample) => void;
}) {
  const programs = programsIn(language);
  return PROGRAM_TOPICS.map((topic) => {
    const inTopic = programs.filter(({ program }) => program.topic === topic);
    if (inTopic.length === 0) return null;
    return (
      <DropdownMenuGroup key={topic}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {topic}
        </DropdownMenuLabel>
        {inTopic.map(({ example }) => (
          <ExampleItem key={example.id} example={example} onSelect={onSelect} />
        ))}
      </DropdownMenuGroup>
    );
  });
}

/**
 * The current language's examples, and the other languages' one level down
 * in the same panel: no hover sub-menus, which don't work on touch screens
 * and run off the edge of phones.
 */
export function ExamplesMenu({ language, onSelect }: ExamplesMenuProps) {
  // JavaScript and TypeScript are listed together, as people switch between them.
  const primary: Language[] = isJavaScriptLike(language)
    ? ["typescript", "javascript"]
    : [language];
  const others = LANGUAGES.filter((info) => !primary.includes(info.id));
  /** The other language being browsed, if any. */
  const [browsing, setBrowsing] = useState<Language | null>(null);
  /** The language whose beginner programs are listed, if any. */
  const [programs, setPrograms] = useState<Language | null>(null);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) return;
        setBrowsing(null);
        setPrograms(null);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Examples">
          <BookOpen aria-hidden />
          <span className="hidden sm:inline">Examples</span>
          <ChevronDown className="hidden opacity-60 sm:inline" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        collisionPadding={8}
        className="max-h-(--radix-dropdown-menu-content-available-height) w-[min(20rem,calc(100vw-1rem))] overflow-y-auto"
      >
        {programs ? (
          <>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setPrograms(null);
              }}
              className="text-muted-foreground"
            >
              <ChevronLeft aria-hidden />
              {languageInfo(programs).name} examples
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>
              {languageInfo(programs).name} programs for beginners
            </DropdownMenuLabel>
            <ProgramGroups language={programs} onSelect={onSelect} />
          </>
        ) : browsing ? (
          <>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setBrowsing(null);
              }}
              className="text-muted-foreground"
            >
              <ChevronLeft aria-hidden />
              All languages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ExampleGroup
              language={browsing}
              onSelect={onSelect}
              onBrowsePrograms={setPrograms}
            />
          </>
        ) : (
          <>
            {primary.map((id) => (
              <ExampleGroup
                key={id}
                language={id}
                onSelect={onSelect}
                onBrowsePrograms={setPrograms}
              />
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Other languages
            </DropdownMenuLabel>
            {others.map((info) => (
              <DropdownMenuItem
                key={info.id}
                // Stay open and show that language's examples.
                onSelect={(event) => {
                  event.preventDefault();
                  setBrowsing(info.id);
                }}
                aria-label={`${info.name} examples`}
              >
                {info.name}
                <ChevronRight className="ml-auto opacity-60" aria-hidden />
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
