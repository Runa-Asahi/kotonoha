import { useMemo } from "react";
import { useStore, dayTotal } from "../store";
import { buildQueue, dayKey } from "./srs";
import { forDeck, type DeckId } from "./decks";
import type { Word } from "./words";

export function useDeckState(deck: DeckId) {
  const cards = useStore((s) => s.cards);
  const known = useStore((s) => s.known);
  const starred = useStore((s) => s.starred);
  return useMemo(() => ({ cards: forDeck(cards, deck), known: forDeck(known, deck), starred: forDeck(starred, deck) }), [cards, known, starred, deck]);
}

export function useToday(deck: DeckId, words: Word[] | null) {
  const { cards, known } = useDeckState(deck);
  const log = useStore((s) => s.log);
  const settings = useStore((s) => s.settings);
  const extra = useStore((s) => s.extra);
  return useMemo(() => {
    if (!words) return null;
    const today = dayTotal(log[dayKey()], deck);
    const ids = words.filter((w) => !known[w.id]).map((w) => w.id);
    const q = buildQueue({
      cards,
      wordIds: ids,
      now: Date.now(),
      newLeft: Math.max(0, settings.dailyNew + (extra[`${dayKey()}:${deck}`] ?? 0) - today.n),
      reviewLimit: Math.max(0, settings.reviewLimit - today.r),
    });
    return { ...q, today, unlearned: ids.filter((id) => !cards[id]).length, learned: Object.keys(cards).length, known: Object.keys(known).length, total: words.length };
  }, [words, cards, known, log, settings, deck, extra]);
}
