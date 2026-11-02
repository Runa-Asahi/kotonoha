import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";

export { Rating, State };
export type StoredCard = Omit<Card, "due" | "last_review"> & { due: number; last_review?: number };

export function toStored(c: Card): StoredCard {
  return { ...c, due: c.due.getTime(), last_review: c.last_review ? c.last_review.getTime() : undefined };
}
export function fromStored(s: StoredCard): Card {
  return { ...s, due: new Date(s.due), last_review: s.last_review ? new Date(s.last_review) : undefined };
}

export function makeScheduler(retention: number) {
  return fsrs(generatorParameters({ request_retention: retention, enable_fuzz: true, enable_short_term: true }));
}

export function review(stored: StoredCard | undefined, grade: Grade, now: Date, retention = 0.9): StoredCard {
  const card = stored ? fromStored(stored) : createEmptyCard(now);
  return toStored(makeScheduler(retention).next(card, now, grade).card);
}

/** Preview of next intervals for each button, e.g. {1:"1分钟",3:"10分钟"} */
export function previewIntervals(stored: StoredCard | undefined, now: Date, retention = 0.9) {
  const card = stored ? fromStored(stored) : createEmptyCard(now);
  const r = makeScheduler(retention).repeat(card, now);
  const out = {} as Record<Grade, string>;
  for (const g of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Grade[]) {
    out[g] = formatInterval(r[g].card.due.getTime() - now.getTime());
  }
  return out;
}

export function formatInterval(ms: number) {
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m}分钟`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}小时`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}天`;
  if (d < 365) return `${Math.round(d / 30)}个月`;
  return `${(d / 365).toFixed(1)}年`;
}

export function dayKey(t: number | Date = Date.now()) {
  const d = new Date(t);
  // Learning day rolls over at 4am, like Anki/墨墨.
  d.setHours(d.getHours() - 4);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type QueueInput = {
  cards: Record<number, StoredCard>;
  wordIds: number[];
  now: number;
  newLeft: number;
  reviewLimit: number;
};

/** Due reviews (most overdue first) followed by the remaining new words for today. */
export function buildQueue({ cards, wordIds, now, newLeft, reviewLimit }: QueueInput) {
  const due: { id: number; due: number }[] = [];
  const fresh: number[] = [];
  for (const id of wordIds) {
    const c = cards[id];
    if (!c) {
      if (fresh.length < newLeft) fresh.push(id);
    } else if (c.due <= now) due.push({ id, due: c.due });
  }
  due.sort((a, b) => a.due - b.due);
  return { review: due.slice(0, reviewLimit).map((d) => d.id), fresh };
}

/** Interleave: a few reviews, then a new word, so sessions stay varied. */
export function interleave(review: number[], fresh: number[], ratio = 3) {
  const out: number[] = [];
  let r = 0,
    f = 0;
  while (r < review.length || f < fresh.length) {
    for (let i = 0; i < ratio && r < review.length; i++) out.push(review[r++]);
    if (f < fresh.length) out.push(fresh[f++]);
  }
  return out;
}

/** FSRS-6 forgetting curve: probability of recall now (0–1). */
export function retrievability(c: StoredCard, now = Date.now(), decay = 0.1542) {
  if (c.last_review == null || c.stability <= 0) return 0;
  const t = Math.max(0, (now - c.last_review) / 864e5);
  const factor = Math.pow(0.9, -1 / decay) - 1;
  return Math.pow(1 + (factor * t) / c.stability, -decay);
}
