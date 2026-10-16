"use client";

import { BookOpen, ChevronDown } from "lucide-react";
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
import type { CodeExample } from "@/types/playground";

interface ExamplesMenuProps {
  onSelect: (example: CodeExample) => void;
}

export function ExamplesMenu({ onSelect }: ExamplesMenuProps) {
  const groups = [
    {
      label: "TypeScript",
      items: EXAMPLES.filter((e) => e.language === "typescript"),
    },
    {
      label: "JavaScript",
      items: EXAMPLES.filter((e) => e.language === "javascript"),
    },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Examples">
          <BookOpen aria-hidden />
          <span className="hidden sm:inline">Examples</span>
          <ChevronDown className="hidden opacity-60 sm:inline" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {groups.map((group, index) => (
          <DropdownMenuGroup key={group.label}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {group.label}
            </DropdownMenuLabel>
            {group.items.map((example) => (
              <DropdownMenuItem
                key={example.id}
                onSelect={() => onSelect(example)}
                className="flex-col items-start gap-0"
              >
                <span className="text-sm">{example.title}</span>
                <span className="text-xs text-muted-foreground">
                  {example.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
