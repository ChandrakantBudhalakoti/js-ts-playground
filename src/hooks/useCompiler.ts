"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  CompilerClient,
  type CompilerState,
} from "@/lib/compiler/compiler-client";

let client: CompilerClient | null = null;

/** Shared compiler worker client (browser only). */
export function getCompilerClient(): CompilerClient {
  client ??= new CompilerClient();
  return client;
}

const LOADING: CompilerState = { status: "loading" };
const subscribe = (onChange: () => void) =>
  getCompilerClient().subscribe(onChange);
const getSnapshot = () => getCompilerClient().state;
const getServerSnapshot = () => LOADING;

/**
 * Compiler worker status. Starts the worker once `needed`: it downloads
 * TypeScript (about 1 MB), which only JavaScript and TypeScript use.
 */
export function useCompilerState(needed: boolean): CompilerState {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (needed) getCompilerClient().start();
  }, [needed]);
  return state;
}
