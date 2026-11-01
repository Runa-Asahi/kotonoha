import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Grade } from "ts-fsrs";
import { dayKey, review, type StoredCard } from "./lib/srs";

export type DayLog = { n: number; r: number; ok: number; ms: number };
export type Settings = { dailyNew: number; reviewLimit: number; retention: number; autoSpeak: boolean; dark: "auto" | "light" | "dark" };

type S = {
  cards: Record<string, StoredCard>;
  /** words marked as "太简单 / 已掌握" — never scheduled */
  known: Record<string, true>;
  starred: Record<string, true>;
  log: Record<string, DayLog>;
  settings: Settings;
  grade: (id: number, g: Grade, ms: number) => void;
  undo: { id: number; prev?: StoredCard; day: string; wasNew: boolean; ok: boolean; ms: number } | null;
  undoLast: () => number | null;
  markKnown: (id: number) => void;
  toggleStar: (id: number) => void;
  setSettings: (p: Partial<Settings>) => void;
  importData: (json: string) => void;
  reset: () => void;
};

const defaults: Settings = { dailyNew: 20, reviewLimit: 200, retention: 0.9, autoSpeak: true, dark: "auto" };
const empty = { cards: {}, known: {}, starred: {}, log: {}, undo: null };

export const useStore = create<S>()(
  persist(
    (set, get) => ({
      ...empty,
      settings: defaults,
      grade: (id, g, ms) => {
        const { cards, log, settings } = get();
        const prev = cards[id];
        const now = Date.now();
        const day = dayKey(now);
        const d = log[day] ?? { n: 0, r: 0, ok: 0, ms: 0 };
        const ok = g >= 3;
        set({
          cards: { ...cards, [id]: review(prev, g, new Date(now), settings.retention) },
          log: {
            ...log,
            [day]: { n: d.n + (prev ? 0 : 1), r: d.r + (prev ? 1 : 0), ok: d.ok + (ok ? 1 : 0), ms: d.ms + Math.min(ms, 60000) },
          },
          undo: { id, prev, day, wasNew: !prev, ok, ms: Math.min(ms, 60000) },
        });
      },
      undoLast: () => {
        const { undo, cards, log } = get();
        if (!undo) return null;
        const next = { ...cards };
        if (undo.prev) next[undo.id] = undo.prev;
        else delete next[undo.id];
        const d = log[undo.day];
        set({
          cards: next,
          undo: null,
          log: d
            ? { ...log, [undo.day]: { n: d.n - (undo.wasNew ? 1 : 0), r: d.r - (undo.wasNew ? 0 : 1), ok: d.ok - (undo.ok ? 1 : 0), ms: d.ms - undo.ms } }
            : log,
        });
        return undo.id;
      },
      markKnown: (id) => {
        const { known, cards } = get();
        const next = { ...cards };
        delete next[id];
        set({ known: { ...known, [id]: true }, cards: next });
      },
      toggleStar: (id) => {
        const s = { ...get().starred };
        if (s[id]) delete s[id];
        else s[id] = true;
        set({ starred: s });
      },
      setSettings: (p) => set({ settings: { ...get().settings, ...p } }),
      importData: (json) => {
        const d = JSON.parse(json);
        if (!d || typeof d !== "object" || typeof d.cards !== "object") throw new Error("文件格式不正确");
        set({ cards: d.cards, known: d.known ?? {}, starred: d.starred ?? {}, log: d.log ?? {}, settings: { ...defaults, ...d.settings }, undo: null });
      },
      reset: () => set({ ...empty, settings: defaults }),
    }),
    {
      name: "kotonoha-v2",
      version: 1,
      partialize: ({ cards, known, starred, log, settings }) => ({ cards, known, starred, log, settings }),
    },
  ),
);

export function exportData() {
  const { cards, known, starred, log, settings } = useStore.getState();
  return JSON.stringify({ app: "kotonoha", v: 2, at: new Date().toISOString(), cards, known, starred, log, settings });
}
