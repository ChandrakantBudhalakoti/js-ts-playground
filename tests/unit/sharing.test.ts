import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@/lib/languages";
import {
  decodeShareHash,
  encodeShareHash,
  MAX_SHARED_CODE_LENGTH,
  ShareError,
} from "@/lib/sharing/encode-code";

const toBase64Url = (bytes: Uint8Array) =>
  Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

describe("share links", () => {
  it("round-trips code and language, including unicode", async () => {
    const code = "const greeting = 'héllo 👋 世界';\nconsole.log(greeting);\n";
    const hash = await encodeShareHash({ language: "typescript", code });
    expect(hash.startsWith("lang=ts&code=")).toBe(true);
    expect(hash).toMatch(/^[A-Za-z0-9_\-=&]+$/);
    await expect(decodeShareHash(`#${hash}`)).resolves.toEqual({
      language: "typescript",
      code,
    });
  });

  it("round-trips empty code", async () => {
    const hash = await encodeShareHash({ language: "javascript", code: "" });
    await expect(decodeShareHash(hash)).resolves.toEqual({
      language: "javascript",
      code: "",
    });
  });

  it("compresses repetitive code", async () => {
    const code = "console.log('hello');\n".repeat(500);
    const hash = await encodeShareHash({ language: "javascript", code });
    expect(hash.length).toBeLessThan(code.length / 10);
  });

  it("ignores hashes that are not share links", async () => {
    await expect(decodeShareHash("")).resolves.toBeNull();
    await expect(decodeShareHash("#")).resolves.toBeNull();
    await expect(decodeShareHash("#section-2")).resolves.toBeNull();
  });

  it("rejects malformed share links with a ShareError", async () => {
    await expect(decodeShareHash("#lang=py&code=abc")).rejects.toBeInstanceOf(
      ShareError,
    );
    await expect(
      decodeShareHash("#lang=js&code=not*base64!"),
    ).rejects.toBeInstanceOf(ShareError);
    await expect(
      decodeShareHash("#lang=js&code=AAAAAAAA"),
    ).rejects.toBeInstanceOf(ShareError);
    const invalidUtf8 = toBase64Url(
      deflateRawSync(Buffer.from([0xff, 0xfe, 0xfd])),
    );
    await expect(
      decodeShareHash(`#lang=js&code=${invalidUtf8}`),
    ).rejects.toThrow(/corrupted/);
  });

  it("round-trips every language, with standard input when there is some", async () => {
    for (const { id } of LANGUAGES) {
      const doc = { language: id, code: `code in ${id}`, stdin: "1 2\n3\n" };
      expect(await decodeShareHash(await encodeShareHash(doc))).toEqual(doc);
      const plain = { language: id, code: "no input" };
      const hash = await encodeShareHash({ ...plain, stdin: "" });
      expect(hash).not.toContain("&in=");
      expect(await decodeShareHash(hash)).toEqual(plain);
    }
  });

  it("keeps the language codes of existing links", async () => {
    const hash = await encodeShareHash({ language: "python", code: "x" });
    expect(hash.startsWith("lang=py&")).toBe(true);
    expect(
      (await encodeShareHash({ language: "javascript", code: "x" })).startsWith(
        "lang=js&",
      ),
    ).toBe(true);
    await expect(decodeShareHash("#lang=cobol&code=")).rejects.toThrow(
      /unknown language/,
    );
  });

  it("refuses decompression bombs and oversized code", async () => {
    const bomb = toBase64Url(
      deflateRawSync(Buffer.alloc(MAX_SHARED_CODE_LENGTH * 4, 0x61)),
    );
    await expect(decodeShareHash(`#lang=js&code=${bomb}`)).rejects.toThrow(
      /too large/,
    );
    await expect(
      encodeShareHash({
        language: "javascript",
        code: "x".repeat(MAX_SHARED_CODE_LENGTH + 1),
      }),
    ).rejects.toBeInstanceOf(ShareError);
    // Code and input share the size limit.
    await expect(
      decodeShareHash(`#lang=py&code=${bomb.slice(0, 10)}&in=${bomb}`),
    ).rejects.toBeInstanceOf(ShareError);
  });
});
