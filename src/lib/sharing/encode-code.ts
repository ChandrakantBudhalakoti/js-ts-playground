import type { Language } from "@/types/playground";

export interface SharedDocument {
  language: Language;
  code: string;
}

/** Largest code (in characters) accepted from a share link. */
export const MAX_SHARED_CODE_LENGTH = 200_000;
/** Longest encoded payload we create or accept. Hash fragments never reach the server. */
export const MAX_SHARE_PAYLOAD_LENGTH = 100_000;

const LANGUAGE_CODES: Record<Language, string> = {
  javascript: "js",
  typescript: "ts",
};
const CODE_LANGUAGES: Record<string, Language> = {
  js: "javascript",
  ts: "typescript",
};

export class ShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShareError";
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(value))
    throw new ShareError("The share link contains invalid characters.");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new ShareError("The share link is not valid base64.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function readAll(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new ShareError("The shared code is too large.");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function transform(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
  maxBytes: number,
) {
  const source = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return readAll(source, maxBytes);
}

/** Encode code into a URL hash fragment (without the leading `#`). */
export async function encodeShareHash(doc: SharedDocument): Promise<string> {
  if (doc.code.length > MAX_SHARED_CODE_LENGTH) {
    throw new ShareError("This code is too large to share in a link.");
  }
  const raw = new TextEncoder().encode(doc.code);
  const compressed = await transform(
    raw,
    new CompressionStream("deflate-raw"),
    Number.MAX_SAFE_INTEGER,
  );
  const payload = toBase64Url(compressed);
  if (payload.length > MAX_SHARE_PAYLOAD_LENGTH) {
    throw new ShareError("This code is too large to share in a link.");
  }
  return `lang=${LANGUAGE_CODES[doc.language]}&code=${payload}`;
}

/**
 * Decode a hash fragment. Returns `null` when the hash is not a share link at
 * all, and throws `ShareError` when it looks like one but is malformed.
 */
export async function decodeShareHash(
  hash: string,
): Promise<SharedDocument | null> {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const payload = params.get("code");
  if (payload === null) return null;

  const language = CODE_LANGUAGES[params.get("lang") ?? ""];
  if (!language)
    throw new ShareError("The share link has an unknown language.");
  if (payload.length === 0) return { language, code: "" };
  if (payload.length > MAX_SHARE_PAYLOAD_LENGTH)
    throw new ShareError("The share link is too long.");

  const compressed = fromBase64Url(payload);
  let bytes: Uint8Array;
  try {
    // UTF-8 uses at most 3 bytes per UTF-16 code unit.
    bytes = await transform(
      compressed,
      new DecompressionStream("deflate-raw"),
      MAX_SHARED_CODE_LENGTH * 3,
    );
  } catch (error) {
    if (error instanceof ShareError) throw error;
    throw new ShareError("The share link is corrupted.");
  }
  let code: string;
  try {
    code = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ShareError("The share link is corrupted.");
  }
  if (code.length > MAX_SHARED_CODE_LENGTH)
    throw new ShareError("The shared code is too large.");
  return { language, code };
}
