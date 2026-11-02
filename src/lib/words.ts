import type { DeckId } from "./decks";

export type Word = {
  id: number;
  word: string;
  meaning: string;
  phrases: [string, string][];
  /** Japanese: kana reading ("" when the word itself is kana) */
  reading: string;
  /** Japanese: Hepburn romaji of the reading */
  romaji?: string;
  ipaUS?: string;
  ipaUK?: string;
  forms?: [string, string][];
  example?: string;
  exampleZh?: string;
  hook?: string;
  parts?: { t: string; g: string }[];
};

type Raw = [string, string, [string, string][]?, string?, ([string, string, string, string] | 0)?, string?, string?];

const FORM: Record<string, string> = { p: "过去式", d: "过去分词", i: "现在分词", "3": "三单", s: "复数", r: "比较级", t: "最高级" };

const cache = new Map<DeckId, Promise<Word[]>>();

export function parseWords(raw: Raw[], lang: "en" | "ja" = "en"): Word[] {
  return raw.map(([word, meaning, phrases, reading, extra, alt, forms], id) => {
    const w: Word = { id, word, meaning, phrases: phrases ?? [], reading: "" };
    if (lang === "ja") {
      w.reading = reading ?? "";
      if (alt) w.romaji = alt;
    } else {
      if (reading) w.ipaUS = reading;
      if (alt) w.ipaUK = alt;
      if (forms) {
        const seen = new Set<string>();
        w.forms = forms.split("/").flatMap((f) => {
          const [k, v] = f.split(":");
          const label = FORM[k];
          if (!label || !v || seen.has(label)) return [];
          seen.add(label);
          return [[label, v] as [string, string]];
        });
      }
    }
    if (extra) {
      const [example, exampleZh, hook, parts] = extra;
      Object.assign(w, {
        example,
        exampleZh,
        hook,
        parts: parts ? parts.split("|").map((p) => { const [t, g] = p.split("="); return { t, g }; }) : [],
      });
    }
    return w;
  });
}

/** What TTS / audio should pronounce for a Japanese word. */
export const kanaReading = (w: Word) => w.reading;

export function loadDeck(deck: DeckId): Promise<Word[]> {
  let p = cache.get(deck);
  if (!p) {
    const lang = deck.startsWith("n") ? "ja" : "en";
    p = fetch(`${import.meta.env.BASE_URL}words/${deck}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`词库加载失败（${r.status}）`);
        return r.json() as Promise<Raw[]>;
      })
      .then((raw) => parseWords(raw, lang))
      .catch((e) => {
        cache.delete(deck);
        throw e;
      });
    cache.set(deck, p);
  }
  return p;
}
