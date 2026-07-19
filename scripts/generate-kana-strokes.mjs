import fs from "node:fs";
import path from "node:path";

const sourceRoot = process.argv[2];
const outputFile = process.argv[3];

if (!sourceRoot || !outputFile) {
  throw new Error("Usage: node scripts/generate-kana-strokes.mjs <kanjivg/kanji> <output.ts>");
}

const dayKana = {
  1: "あいうえお",
  2: "かきくけこ",
  3: "さしすせそ",
  4: "たちつてと",
  5: "なにぬねの",
  6: "はひふへほ",
  7: "まみむめも",
  8: "やゆよらりるれろわをん",
  9: "がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ",
  10: "きゃしゅちょっ",
  11: "アイウエオカキクケコサシスセソタチツテトナニヌネノ",
  12: "ハヒフヘホマミムメモヤユヨラリルレロワヲン",
};

const uniqueKana = [...new Set(Object.values(dayKana).join(""))];
const result = {};

for (const kana of uniqueKana) {
  const fileName = `${kana.codePointAt(0).toString(16).padStart(5, "0")}.svg`;
  const svg = fs.readFileSync(path.join(sourceRoot, fileName), "utf8");
  const paths = [...svg.matchAll(/<path[^>]+d="([^"]+)"/g)].map((match) => match[1]);
  const labels = [...svg.matchAll(/<text transform="matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)">(\d+)<\/text>/g)]
    .map((match) => [Number(match[1]), Number(match[2]), Number(match[3])]);
  result[kana] = { paths, labels };
}

const banner = `/**
 * Kana stroke paths derived from KanjiVG by Ulrich Apel and contributors.
 * Source: https://kanjivg.tagaini.net/
 * License: CC BY-SA 3.0 — https://creativecommons.org/licenses/by-sa/3.0/
 * Paths are reproduced without changing their geometry.
 */
`;

fs.writeFileSync(
  outputFile,
  `${banner}
export type KanaStroke = { paths: string[]; labels: number[][] };

export const kanaByDay: Record<number, string[]> = ${JSON.stringify(
    Object.fromEntries(Object.entries(dayKana).map(([day, kana]) => [day, [...kana]])),
    null,
    2,
  )};

export const kanaStrokes: Record<string, KanaStroke> = ${JSON.stringify(result, null, 2)};

export const confusingPairs = [
  ["あ", "お"], ["き", "さ"], ["ぬ", "め"], ["れ", "ね"], ["ね", "わ"],
  ["シ", "ツ"], ["ソ", "ン"], ["ク", "ケ"], ["ア", "マ"],
] as const;
`,
);
