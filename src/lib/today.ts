import { useMemo } from "react";
import { useStore } from "../store";
import { buildQueue, dayKey } from "./srs";
import type { Word } from "./words";

export function useToday(words: Word[] | null) {
  const cards = useStore((s) => s.cards);
  const known = useStore((s) => s.known);
  const log = useStore((s) => s.log);
  const settings = useStore((s) => s.settings);
  return useMemo(() => {
    if (!words) return null;
    const today = log[dayKey()] ?? { n: 0, r: 0, ok: 0, ms: 0 };
    const ids = words.filter((w) => !known[w.id]).map((w) => w.id);
    const q = buildQueue({
      cards,
      wordIds: ids,
      now: Date.now(),
      newLeft: Math.max(0, settings.dailyNew - today.n),
      reviewLimit: Math.max(0, settings.reviewLimit - today.r),
    });
    return { ...q, today, learned: Object.keys(cards).length, known: Object.keys(known).length, total: words.length };
  }, [words, cards, known, log, settings]);
}
