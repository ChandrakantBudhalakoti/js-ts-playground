"use client";

import { useSyncExternalStore } from "react";
import { ClangClient, type ClangState } from "@/lib/clang/clang-client";
import { downloads } from "@/lib/offline/downloads";

let client: ClangClient | null = null;

/** Shared Clang worker client (browser only). */
export function getClangClient(): ClangClient {
  if (!client) {
    const created = new ClangClient();
    client = created;
    // Once Clang has downloaded, save it for offline use.
    let saved = false;
    created.subscribe(() => {
      if (saved || created.state.status !== "ready") return;
      saved = true;
      downloads.downloaded("clang");
    });
  }
  return client;
}

const IDLE: ClangState = { status: "idle" };
const subscribe = (onChange: () => void) =>
  getClangClient().subscribe(onChange);
const getSnapshot = () => getClangClient().state;
const getServerSnapshot = () => IDLE;

/** The C/C++ compiler's download and readiness. */
export function useClangState(): ClangState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
