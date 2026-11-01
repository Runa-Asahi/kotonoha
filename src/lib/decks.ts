import counts from "../data/counts.json";

export type DeckId = "toefl" | "cet6" | "n1" | "n2" | "n3" | "n4" | "n5";
export type Deck = { id: DeckId; label: string; level: string; lang: "en" | "ja"; desc: string; count: number };

const meta: Omit<Deck, "count">[] = [
  { id: "toefl", label: "新托福", level: "TOEFL", lang: "en", desc: "托福核心词汇" },
  { id: "cet6", label: "六级", level: "CET-6", lang: "en", desc: "大学英语六级" },
  { id: "n5", label: "N5", level: "JLPT N5", lang: "ja", desc: "日语入门" },
  { id: "n4", label: "N4", level: "JLPT N4", lang: "ja", desc: "日语初级" },
  { id: "n3", label: "N3", level: "JLPT N3", lang: "ja", desc: "日语中级" },
  { id: "n2", label: "N2", level: "JLPT N2", lang: "ja", desc: "日语中高级" },
  { id: "n1", label: "N1", level: "JLPT N1", lang: "ja", desc: "日语高级" },
];

export const DECKS: Deck[] = meta.map((d) => ({ ...d, count: (counts as Record<string, number>)[d.id] ?? 0 }));
export const deckOf = (id: string): Deck => DECKS.find((d) => d.id === id) ?? DECKS[0];
export const cardKey = (deck: DeckId, id: number) => `${deck}:${id}`;

/** Pick the entries of one deck out of a flat `deck:id` keyed record, re-keyed by numeric id. */
export function forDeck<T>(rec: Record<string, T>, deck: DeckId): Record<number, T> {
  const out: Record<number, T> = {};
  const p = `${deck}:`;
  for (const k in rec) if (k.startsWith(p)) out[Number(k.slice(p.length))] = rec[k];
  return out;
}
