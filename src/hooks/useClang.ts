"use client";

import { useSyncExternalStore } from "react";
import { ClangClient, type ClangState } from "@/lib/clang/clang-client";

let client: ClangClient | null = null;

/** Shared Clang worker client (browser only). */
export function getClangClient(): ClangClient {
  client ??= new ClangClient();
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
