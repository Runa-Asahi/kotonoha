import { GOJUON, VOICED, YOON } from "../data/kana";

export type KanaItem = { hira: string; kata: string; romaji: string };
export const SEION: KanaItem[] = GOJUON;
export const ALL_KANA: KanaItem[] = [...GOJUON, ...VOICED, ...YOON.flat()];

export type Q = { item: KanaItem; choices: string[]; answer: string };

/** Build quiz questions. mode "read": show kana, pick romaji. mode "listen": hear, pick kana. */
export function makeQuiz(pool: KanaItem[], n: number, script: "hira" | "kata", mode: "read" | "listen", rnd = Math.random, weight?: (k: KanaItem) => number): Q[] {
  // ぢ/づ share sounds with じ/ず and を with お: avoid ambiguous distractors
  const uniq = pool.filter((k, i) => pool.findIndex((x) => x.romaji === k.romaji) === i);
  const picks: KanaItem[] = [];
  const bag = uniq.flatMap((k) => Array(Math.max(1, Math.round(weight?.(k) ?? 1))).fill(k) as KanaItem[]);
  while (picks.length < Math.min(n, uniq.length)) {
    const k = bag[Math.floor(rnd() * bag.length)];
    if (!picks.includes(k)) picks.push(k);
  }
  return picks.map((item) => {
    const answer = mode === "read" ? item.romaji : item[script];
    const others = uniq.filter((x) => x !== item).sort(() => rnd() - 0.5).slice(0, 3).map((x) => (mode === "read" ? x.romaji : x[script]));
    const choices = [...others, answer].sort(() => rnd() - 0.5);
    return { item, choices, answer };
  });
}
