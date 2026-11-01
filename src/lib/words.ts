import type { DeckId } from "./decks";

export type Word = {
  id: number;
  word: string;
  meaning: string;
  phrases: [string, string][];
  reading: string;
  example?: string;
  exampleZh?: string;
  hook?: string;
  parts?: { t: string; g: string }[];
};

type Raw = [string, string, [string, string][]?, string?, [string, string, string, string]?];

const cache = new Map<DeckId, Promise<Word[]>>();

export function parseWords(raw: Raw[]): Word[] {
  return raw.map(([word, meaning, phrases, reading, extra], id) => {
    const w: Word = { id, word, meaning, phrases: phrases ?? [], reading: reading ?? "" };
    if (extra) {
      const [example, exampleZh, hook, parts] = extra;
      Object.assign(w, {
        example, exampleZh, hook,
        parts: parts ? parts.split("|").map((p) => { const [t, g] = p.split("="); return { t, g }; }) : [],
      });
    }
    return w;
  });
}

/** Kana reading without the romaji suffix, e.g. "けいけん · keiken" -> "けいけん" */
export const kanaReading = (w: Word) => w.reading.split(" · ")[0];

export function loadDeck(deck: DeckId): Promise<Word[]> {
  let p = cache.get(deck);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}words/${deck}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`词库加载失败（${r.status}）`);
        return r.json() as Promise<Raw[]>;
      })
      .then(parseWords)
      .catch((e) => {
        cache.delete(deck);
        throw e;
      });
    cache.set(deck, p);
  }
  return p;
}
