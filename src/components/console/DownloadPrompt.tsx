"use client";

import { CloudDownload, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useLocale";
import type { MessageKey } from "@/lib/i18n";

interface Connection {
  saveData?: boolean;
  type?: string;
  effectiveType?: string;
}

/** What the Network Information API (where available) says about the connection. */
function connectionNote(): MessageKey | null {
  if (typeof navigator === "undefined") return null;
  const connection = (navigator as Navigator & { connection?: Connection })
    .connection;
  if (!connection) return null;
  if (connection.saveData) return "download.dataSaver";
  if (connection.type === "cellular") return "download.cellular";
  if (["slow-2g", "2g", "3g"].includes(connection.effectiveType ?? ""))
    return "download.slow";
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
  const t = useT();
  const sizeText = size
    ? t("download.oneTime", { size })
    : t("download.oneTimeUnknown");
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
            {t("download.offlineTitle", { subject })}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t("download.offlineBody", { size: sizeText })}
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
          {t("download.needs", { subject, size: sizeText })}
        </p>
        <p className="mt-1 text-muted-foreground">
          {note && <>{t(note)} </>}
          {t("download.saved")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" className="h-9" onClick={onDownload}>
            {t("download.download")}
          </Button>
          <Button size="sm" variant="ghost" className="h-9" onClick={onCancel}>
            {t("download.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
