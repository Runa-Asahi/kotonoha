import { GOJUON, VOICED, YOON, type Kana } from "../data/kana";

export type KanaItem = { hira: string; kata: string; romaji: string; shot?: string };
export const SEION: KanaItem[] = GOJUON;
export const ALL_KANA: KanaItem[] = [...GOJUON, ...VOICED, ...YOON.flat()];
export type Mode = "story" | "read" | "listen";
export type Q = { item: KanaItem; choices: KanaItem[] };

export function shuffle<T>(list: T[], rnd = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * story: read the 纸灯町 storyboard, pick the kana (v1.0.0 quiz)
 * read: see kana, pick romaji · listen: hear bundled audio, pick kana
 * Kana with more mistakes are drawn more often. Same-sound kana (ぢ/じ, づ/ず, を/お) never compete.
 */
export function makeQuiz(pool: KanaItem[], n: number, rnd = Math.random, weight?: (k: KanaItem) => number): Q[] {
  const uniq = pool.filter((k, i) => pool.findIndex((x) => x.romaji === k.romaji) === i);
  const bag = uniq.flatMap((k) => Array<KanaItem>(Math.max(1, Math.round(weight?.(k) ?? 1))).fill(k));
  const picks: KanaItem[] = [];
  while (picks.length < Math.min(n, uniq.length)) {
    const k = bag[Math.floor(rnd() * bag.length)];
    if (!picks.includes(k)) picks.push(k);
  }
  return picks.map((item) => ({ item, choices: shuffle([item, ...shuffle(uniq.filter((x) => x !== item), rnd).slice(0, 3)], rnd) }));
}

export const storyPool = (): (KanaItem & Kana)[] => GOJUON.filter((k) => k.romaji !== "o" || k.hira === "お");
