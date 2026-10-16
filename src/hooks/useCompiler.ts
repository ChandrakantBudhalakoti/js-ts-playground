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

/** Compiler worker status. Starts the worker after mount. */
export function useCompilerState(): CompilerState {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    getCompilerClient().start();
  }, []);
  return state;
}
