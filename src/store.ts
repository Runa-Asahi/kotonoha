import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Grade } from "ts-fsrs";
import { dayKey, review, type StoredCard } from "./lib/srs";
import { cardKey, type DeckId } from "./lib/decks";

export type DayLog = { n: number; r: number; ok: number; ms: number };
export type Settings = {
  deck: DeckId;
  dailyNew: number;
  reviewLimit: number;
  retention: number;
  autoSpeak: boolean;
  dark: "auto" | "light" | "dark";
  season: "auto" | "spring" | "summer" | "autumn" | "winter";
  accent: "us" | "uk";
};
/** log[day][deck] */
export type Log = Record<string, Partial<Record<DeckId, DayLog>>>;

type Undo = { key: string; prev?: StoredCard; day: string; deck: DeckId; wasNew: boolean; ok: boolean; ms: number };

type S = {
  /** keyed by `${deck}:${wordId}` */
  cards: Record<string, StoredCard>;
  known: Record<string, true>;
  starred: Record<string, true>;
  log: Log;
  /** kana drill: per-kana correct/wrong counts */
  kana: Record<string, [number, number]>;
  kanaBest: number;
  /** extra new words unlocked today: key `${day}:${deck}` */
  extra: Record<string, number>;
  settings: Settings;
  undo: Undo | null;
  grade: (deck: DeckId, id: number, g: Grade, ms: number) => void;
  undoLast: () => number | null;
  markKnown: (deck: DeckId, id: number) => void;
  toggleStar: (deck: DeckId, id: number) => void;
  kanaResult: (kana: string, ok: boolean) => void;
  setKanaBest: (n: number) => void;
  addExtra: (deck: DeckId, n: number) => void;
  setSettings: (p: Partial<Settings>) => void;
  importData: (json: string) => void;
  reset: () => void;
};

export const EMPTY_DAY: DayLog = { n: 0, r: 0, ok: 0, ms: 0 };
const defaults: Settings = { deck: "toefl", dailyNew: 20, reviewLimit: 200, retention: 0.9, autoSpeak: true, dark: "auto", season: "auto", accent: "us" };
const empty = { cards: {}, known: {}, starred: {}, log: {}, kana: {}, kanaBest: 0, extra: {}, undo: null };

const addDay = (a: DayLog, b: DayLog, sign = 1): DayLog => ({ n: a.n + sign * b.n, r: a.r + sign * b.r, ok: a.ok + sign * b.ok, ms: a.ms + sign * b.ms });

/** v2.0.0 stored TOEFL-only data with numeric keys and a flat log. */
export function migrateV1(old: Record<string, unknown>) {
  const rekey = (r: unknown) =>
    Object.fromEntries(Object.entries((r as Record<string, unknown>) ?? {}).map(([k, v]) => [/^\d+$/.test(k) ? `toefl:${k}` : k, v]));
  const log: Log = {};
  for (const [day, v] of Object.entries((old.log as Record<string, unknown>) ?? {})) {
    log[day] = v && typeof (v as DayLog).n === "number" ? { toefl: v as DayLog } : (v as Log[string]);
  }
  return {
    ...old,
    cards: rekey(old.cards),
    known: rekey(old.known),
    starred: rekey(old.starred),
    log,
    kana: (old.kana as S["kana"]) ?? {},
    kanaBest: (old.kanaBest as number) ?? 0,
    extra: (old.extra as S["extra"]) ?? {},
    settings: { ...defaults, ...(old.settings as Partial<Settings>) },
  };
}

export const useStore = create<S>()(
  persist(
    (set, get) => ({
      ...empty,
      settings: defaults,
      grade: (deck, id, g, ms) => {
        const { cards, log, settings } = get();
        const key = cardKey(deck, id);
        const prev = cards[key];
        const now = Date.now();
        const day = dayKey(now);
        const t = Math.min(ms, 60000);
        const ok = g >= 3;
        const delta = { n: prev ? 0 : 1, r: prev ? 1 : 0, ok: ok ? 1 : 0, ms: t };
        set({
          cards: { ...cards, [key]: review(prev, g, new Date(now), settings.retention) },
          log: { ...log, [day]: { ...log[day], [deck]: addDay(log[day]?.[deck] ?? EMPTY_DAY, delta) } },
          undo: { key, prev, day, deck, wasNew: !prev, ok, ms: t },
        });
      },
      undoLast: () => {
        const { undo, cards, log } = get();
        if (!undo) return null;
        const next = { ...cards };
        if (undo.prev) next[undo.key] = undo.prev;
        else delete next[undo.key];
        const d = log[undo.day]?.[undo.deck];
        const delta = { n: undo.wasNew ? 1 : 0, r: undo.wasNew ? 0 : 1, ok: undo.ok ? 1 : 0, ms: undo.ms };
        set({ cards: next, undo: null, log: d ? { ...log, [undo.day]: { ...log[undo.day], [undo.deck]: addDay(d, delta, -1) } } : log });
        return Number(undo.key.split(":")[1]);
      },
      markKnown: (deck, id) => {
        const key = cardKey(deck, id);
        const next = { ...get().cards };
        delete next[key];
        set({ known: { ...get().known, [key]: true }, cards: next });
      },
      toggleStar: (deck, id) => {
        const key = cardKey(deck, id);
        const s = { ...get().starred };
        if (s[key]) delete s[key];
        else s[key] = true;
        set({ starred: s });
      },
      kanaResult: (k, ok) => {
        const [a, b] = get().kana[k] ?? [0, 0];
        set({ kana: { ...get().kana, [k]: ok ? [a + 1, b] : [a, b + 1] } });
      },
      setKanaBest: (n) => n > get().kanaBest && set({ kanaBest: n }),
      addExtra: (deck, n) => {
        const k = `${dayKey()}:${deck}`;
        set({ extra: { ...get().extra, [k]: (get().extra[k] ?? 0) + n } });
      },
      setSettings: (p) => set({ settings: { ...get().settings, ...p } }),
      importData: (json) => {
        const d = JSON.parse(json);
        if (!d || typeof d !== "object" || typeof d.cards !== "object") throw new Error("文件格式不正确");
        const m = migrateV1(d) as unknown as S;
        set({ cards: m.cards, known: m.known, starred: m.starred, log: m.log, kana: m.kana, kanaBest: m.kanaBest, extra: m.extra, settings: m.settings, undo: null });
      },
      reset: () => set({ ...empty, settings: { ...defaults, deck: get().settings.deck } }),
    }),
    {
      name: "kotonoha-v2",
      version: 3,
      partialize: ({ cards, known, starred, log, kana, kanaBest, extra, settings }) => ({ cards, known, starred, log, kana, kanaBest, extra, settings }),
      migrate: (persisted, version) => {
        const p = (version < 2 ? migrateV1(persisted as Record<string, unknown>) : persisted) as S;
        return { ...p, settings: { ...defaults, ...p.settings }, kanaBest: p.kanaBest ?? 0, extra: p.extra ?? {} } as S;
      },
    },
  ),
);

export function exportData() {
  const { cards, known, starred, log, kana, settings } = useStore.getState();
  return JSON.stringify({ app: "kotonoha", v: 3, at: new Date().toISOString(), cards, known, starred, log, kana, settings });
}

export function dayTotal(d: Log[string] | undefined, deck?: DeckId): DayLog {
  if (!d) return EMPTY_DAY;
  if (deck) return d[deck] ?? EMPTY_DAY;
  return Object.values(d).reduce<DayLog>((a, b) => addDay(a, b ?? EMPTY_DAY), EMPTY_DAY);
}
