"use client";

import { BookOpen, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
import { EXAMPLES } from "@/lib/examples";
import { isJavaScriptLike, LANGUAGES, languageInfo } from "@/lib/languages";
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
}: {
  language: Language;
  onSelect: (example: CodeExample) => void;
}) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        {languageInfo(language).name}
      </DropdownMenuLabel>
      {EXAMPLES.filter((e) => e.language === language).map((example) => (
        <ExampleItem key={example.id} example={example} onSelect={onSelect} />
      ))}
    </DropdownMenuGroup>
  );
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

  return (
    <DropdownMenu onOpenChange={(open) => !open && setBrowsing(null)}>
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
        {browsing ? (
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
            <ExampleGroup language={browsing} onSelect={onSelect} />
          </>
        ) : (
          <>
            {primary.map((id) => (
              <ExampleGroup key={id} language={id} onSelect={onSelect} />
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
