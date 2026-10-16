import type { SourceLocation } from "@/types/playground";

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_INDEX = new Map([...BASE64].map((char, index) => [char, index]));

/** [generatedColumn, originalLine, originalColumn], all zero-based. */
type Segment = [number, number, number];

function decodeVlq(segment: string): number[] {
  const values: number[] = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = BASE64_INDEX.get(char);
    if (digit === undefined) throw new Error(`Invalid VLQ character "${char}"`);
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
    } else {
      const negative = value & 1;
      value >>>= 1;
      values.push(negative ? -value : value);
      value = 0;
      shift = 0;
    }
  }
  return values;
}

function decodeMappings(mappings: string): Segment[][] {
  const lines: Segment[][] = [];
  let sourceLine = 0;
  let sourceColumn = 0;
  for (const line of mappings.split(";")) {
    const segments: Segment[] = [];
    let generatedColumn = 0;
    for (const raw of line.split(",")) {
      if (!raw) continue;
      const fields = decodeVlq(raw);
      generatedColumn += fields[0];
      if (fields.length >= 4) {
        sourceLine += fields[2];
        sourceColumn += fields[3];
        segments.push([generatedColumn, sourceLine, sourceColumn]);
      }
    }
    lines.push(segments);
  }
  return lines;
}

export type PositionMapper = (
  generated: SourceLocation,
) => SourceLocation | null;

/**
 * Create a mapper from one-based positions in generated JavaScript back to
 * one-based positions in the original source. Returns `null` when the source
 * map is missing or malformed.
 */
export function createPositionMapper(
  sourceMapJson: string | null,
): PositionMapper | null {
  if (!sourceMapJson) return null;
  let lines: Segment[][];
  try {
    const parsed = JSON.parse(sourceMapJson) as { mappings?: unknown };
    if (typeof parsed.mappings !== "string") return null;
    lines = decodeMappings(parsed.mappings);
  } catch {
    return null;
  }

  return ({ line, column }) => {
    const segments = lines[line - 1];
    if (!segments || segments.length === 0) return null;
    const target = column - 1;
    let best: Segment | undefined;
    for (const segment of segments) {
      if (segment[0] <= target) best = segment;
      else break;
    }
    best ??= segments[0];
    return { line: best[1] + 1, column: best[2] + 1 };
  };
}
