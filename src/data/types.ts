export type DeckId = "cet6" | "toefl" | "n3" | "n2" | "n1";

export type Part = { t: string; g: string };

export type Word = {
  id: string;
  deck: DeckId;
  word: string;
  reading: string;
  ipa?: string;
  pos: string;
  meaning: string;
  parts: Part[];
  hook: string;
  example: string;
  exampleZh: string;
  roma?: string;
};

export type DeckMeta = {
  id: DeckId;
  label: string;
  level: string;
  lang: "en" | "ja";
};

export const DECKS: DeckMeta[] = [
  { id: "cet6", label: "六级", level: "CET-6", lang: "en" },
  { id: "toefl", label: "托福", level: "TOEFL", lang: "en" },
  { id: "n3", label: "N3", level: "JLPT N3", lang: "ja" },
  { id: "n2", label: "N2", level: "JLPT N2", lang: "ja" },
  { id: "n1", label: "N1", level: "JLPT N1", lang: "ja" },
];

export function deckOf(id: DeckId): DeckMeta {
  return DECKS.find((deck) => deck.id === id) ?? DECKS[0];
}
