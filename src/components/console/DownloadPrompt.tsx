"use client";

import { CloudDownload, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Connection {
  saveData?: boolean;
  type?: string;
  effectiveType?: string;
}

/** What the Network Information API (where available) says about the connection. */
function connectionNote(): string | null {
  if (typeof navigator === "undefined") return null;
  const connection = (navigator as Navigator & { connection?: Connection })
    .connection;
  if (!connection) return null;
  if (connection.saveData) return "Data Saver is on.";
  if (connection.type === "cellular") return "You seem to be on mobile data.";
  if (["slow-2g", "2g", "3g"].includes(connection.effectiveType ?? ""))
    return "Your connection looks slow, so it may take a while.";
  return null;
}

interface DownloadPromptProps {
  /** What is downloaded: "Python", "The C and C++ compiler". */
  subject: string;
  /** Approximate size, e.g. "7 MB". */
  size: string | undefined;
  online: boolean;
  /** Not asked: the download was allowed but has not happened yet. */
  allowed: boolean;
  onDownload: () => void;
  onCancel: () => void;
}

/**
 * Asks before a language's first download, with its size, since many
 * people pay for mobile data. Offline, it explains that the language needs
 * a connection once.
 */
export function DownloadPrompt({
  subject,
  size,
  online,
  allowed,
  onDownload,
  onCancel,
}: DownloadPromptProps) {
  const sizeText = size ? `a one-time ${size} download` : "a one-time download";
  if (!online) {
    return (
      <div
        role="status"
        data-testid="download-prompt"
        className="m-3 flex gap-3 rounded-lg border border-amber-600/40 bg-amber-500/5 p-4 text-sm"
      >
        <WifiOff
          className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
        <div>
          <p className="font-medium">
            You&apos;re offline. {subject} needs internet once.
          </p>
          <p className="mt-1 text-muted-foreground">
            It is {sizeText}. Connect once to get it, and after that it works
            without internet. Languages you have already used still run.
          </p>
        </div>
      </div>
    );
  }
  if (allowed) return null;
  const note = connectionNote();
  return (
    <div
      role="region"
      aria-label="Download"
      data-testid="download-prompt"
      className="m-3 flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm"
    >
      <CloudDownload
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div>
        <p className="font-medium">
          {subject} needs {sizeText}.
        </p>
        <p className="mt-1 text-muted-foreground">
          {note && <>{note} </>}
          It is saved in your browser, so after that it works without internet.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" className="h-9" onClick={onDownload}>
            Download
          </Button>
          <Button size="sm" variant="ghost" className="h-9" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
