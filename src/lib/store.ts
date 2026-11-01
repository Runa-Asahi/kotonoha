import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeckId } from "@/data/types";
import { DECKS } from "@/data/types";
import { WORDS } from "@/data/words";
import { dayKey, nextStep, shiftDay, type Rating } from "@/lib/srs";

export type CardProg = {
  stage: number;
  due: number;
  lapses: number;
  reviews: number;
};

type DayLog = { reviews: number; again: number };

type Persisted = {
  selected: DeckId[];
  newPerDay: number;
  cards: Record<string, CardProg>;
  introducedDay: string;
  introducedCount: number;
  extraDay: string;
  extra: number;
  streak: number;
  lastStudyDay: string;
  log: Record<string, DayLog>;
  kanaBest: number;
};

type MemoryStore = Persisted & {
  toggleDeck: (id: DeckId) => void;
  setNewPerDay: (count: number) => void;
  addExtra: (count: number) => void;
  review: (id: string, rating: Rating) => void;
  setKanaBest: (score: number) => void;
  reset: () => void;
};

const initial: Persisted = {
  selected: ["cet6"],
  newPerDay: 10,
  cards: {},
  introducedDay: "",
  introducedCount: 0,
  extraDay: "",
  extra: 0,
  streak: 0,
  lastStudyDay: "",
  log: {},
  kanaBest: 0,
};

const ORDER: DeckId[] = ["cet6", "toefl", "n3", "n2", "n1"];

function orderDecks(ids: DeckId[]): DeckId[] {
  return ORDER.filter((id) => ids.includes(id));
}

export const useMemory = create<MemoryStore>()(
  persist(
    (set) => ({
      ...initial,
      toggleDeck: (id) =>
        set((state) => {
          const has = state.selected.includes(id);
          if (has && state.selected.length === 1) return state;
          const next = has ? state.selected.filter((deck) => deck !== id) : [...state.selected, id];
          return { selected: orderDecks(next) };
        }),
      setNewPerDay: (count) => set({ newPerDay: count }),
      addExtra: (count) =>
        set((state) => {
          const today = dayKey();
          const extra = state.extraDay === today ? state.extra : 0;
          return { extraDay: today, extra: extra + count };
        }),
      review: (id, rating) =>
        set((state) => {
          const prev = state.cards[id];
          const step = nextStep(prev?.stage ?? 0, rating);
          const now = Date.now();
          const today = dayKey();
          const isNew = !prev;
          const introducedCount = (state.introducedDay === today ? state.introducedCount : 0) + (isNew ? 1 : 0);
          let streak = state.streak;
          if (state.lastStudyDay !== today) {
            streak = state.lastStudyDay === shiftDay(today, -1) ? state.streak + 1 : 1;
          } else if (streak === 0) {
            streak = 1;
          }
          const entry = state.log[today] ?? { reviews: 0, again: 0 };
          const log = {
            ...state.log,
            [today]: {
              reviews: entry.reviews + 1,
              again: entry.again + (rating === "again" ? 1 : 0),
            },
          };
          const cutoff = Date.now() - 40 * 24 * 60 * 60 * 1000;
          for (const key of Object.keys(log)) {
            const [year, month, day] = key.split("-").map(Number);
            if (new Date(year, month - 1, day).getTime() < cutoff) delete log[key];
          }
          return {
            cards: {
              ...state.cards,
              [id]: {
                stage: step.stage,
                due: now + step.minutes * 60 * 1000,
                lapses: (prev?.lapses ?? 0) + (rating === "again" ? 1 : 0),
                reviews: (prev?.reviews ?? 0) + 1,
              },
            },
            introducedDay: today,
            introducedCount,
            streak,
            lastStudyDay: today,
            log,
          };
        }),
      setKanaBest: (score) => set((state) => ({ kanaBest: Math.max(state.kanaBest, score) })),
      reset: () =>
        set((state) => ({
          ...initial,
          selected: state.selected,
          newPerDay: state.newPerDay,
        })),
    }),
    {
      name: "kotonoha",
      skipHydration: true,
      partialize: (state) => ({
        selected: state.selected,
        newPerDay: state.newPerDay,
        cards: state.cards,
        introducedDay: state.introducedDay,
        introducedCount: state.introducedCount,
        extraDay: state.extraDay,
        extra: state.extra,
        streak: state.streak,
        lastStudyDay: state.lastStudyDay,
        log: state.log,
        kanaBest: state.kanaBest,
      }),
    },
  ),
);

export function newAllowance(state: Persisted, now = Date.now()): number {
  const today = dayKey(now);
  const introduced = state.introducedDay === today ? state.introducedCount : 0;
  const extra = state.extraDay === today ? state.extra : 0;
  return Math.max(0, state.newPerDay + extra - introduced);
}

export type Summary = {
  due: number;
  learning: number;
  stable: number;
  seen: number;
  fresh: number;
  newLeft: number;
  streak: number;
  pool: number;
  todayReviews: number;
  stages: number[];
};

export function summarize(state: Persisted, now = Date.now()): Summary {
  const today = dayKey(now);
  const pool = WORDS.filter((word) => state.selected.includes(word.deck));
  let due = 0;
  let learning = 0;
  let stable = 0;
  let seen = 0;
  let fresh = 0;
  const stages = Array.from({ length: 11 }, () => 0);
  for (const word of pool) {
    const card = state.cards[word.id];
    if (!card) {
      fresh += 1;
      continue;
    }
    seen += 1;
    stages[card.stage] = (stages[card.stage] ?? 0) + 1;
    if (card.due <= now) due += 1;
    if (card.stage >= 7) stable += 1;
    else learning += 1;
  }
  const yesterday = shiftDay(today, -1);
  const streak = state.lastStudyDay === today || state.lastStudyDay === yesterday ? state.streak : 0;
  return {
    due,
    learning,
    stable,
    seen,
    fresh,
    newLeft: Math.min(fresh, newAllowance(state, now)),
    streak,
    pool: pool.length,
    todayReviews: state.log[today]?.reviews ?? 0,
    stages,
  };
}

export function buildQueue(state: Persisted, now = Date.now()): string[] {
  const selected = state.selected;
  const pool = WORDS.filter((word) => selected.includes(word.deck));
  const due = pool
    .filter((word) => {
      const card = state.cards[word.id];
      return Boolean(card && card.due <= now);
    })
    .sort((a, b) => state.cards[a.id].due - state.cards[b.id].due);
  const room = newAllowance(state, now);
  const fresh = pool
    .filter((word) => !state.cards[word.id])
    .sort((a, b) => selected.indexOf(a.deck) - selected.indexOf(b.deck))
    .slice(0, room);
  return [...due, ...fresh].slice(0, 40).map((word) => word.id);
}

export function deckLabel(id: DeckId): string {
  return DECKS.find((deck) => deck.id === id)?.label ?? id;
}
