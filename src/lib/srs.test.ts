import { describe, expect, it } from "vitest";
import { buildQueue, dayKey, formatInterval, interleave, Rating, review, previewIntervals } from "./srs";
import { parseWords } from "./words";
import { hint } from "./hint";

describe("srs", () => {
  const now = new Date("2026-11-01T10:00:00");
  it("new card graded Again is due within minutes, Easy is days later", () => {
    const a = review(undefined, Rating.Again, now);
    const e = review(undefined, Rating.Easy, now);
    expect(a.due - now.getTime()).toBeLessThan(10 * 60e3);
    expect(e.due - now.getTime()).toBeGreaterThan(864e5);
    expect(a.reps).toBe(1);
  });
  it("intervals grow with successful reviews", () => {
    let c = review(undefined, Rating.Good, now);
    let t = now.getTime();
    const gaps: number[] = [];
    for (let i = 0; i < 4; i++) {
      t = Math.max(t, c.due);
      c = review(c, Rating.Good, new Date(t));
      gaps.push(c.due - t);
    }
    expect(gaps[3]).toBeGreaterThan(gaps[1]);
  });
  it("buildQueue orders overdue first and caps new words", () => {
    const cards = { 1: { ...review(undefined, Rating.Good, now), due: 5 }, 2: { ...review(undefined, Rating.Good, now), due: 2 }, 3: { ...review(undefined, Rating.Good, now), due: 9e15 } };
    const q = buildQueue({ cards, wordIds: [0, 1, 2, 3, 4, 5], now: 100, newLeft: 2, reviewLimit: 10 });
    expect(q.review).toEqual([2, 1]);
    expect(q.fresh).toEqual([0, 4]);
  });
  it("interleave mixes reviews with new words", () => {
    expect(interleave([1, 2, 3, 4], [9, 8], 2)).toEqual([1, 2, 9, 3, 4, 8]);
  });
  it("formats intervals and preview", () => {
    expect(formatInterval(5 * 60e3)).toBe("5分钟");
    expect(formatInterval(3 * 864e5)).toBe("3天");
    expect(Object.keys(previewIntervals(undefined, now))).toHaveLength(4);
  });
  it("day rolls over at 4am", () => {
    expect(dayKey(new Date("2026-11-02T03:00:00"))).toBe("2026-11-01");
    expect(dayKey(new Date("2026-11-02T05:00:00"))).toBe("2026-11-02");
  });
});

describe("words & spell", () => {
  it("parses compact word format", () => {
    const w = parseWords([["abc", "n. 字母"], ["go", "v. 去", [["go on", "继续"]]]]);
    expect(w[1]).toEqual({ id: 1, word: "go", meaning: "v. 去", phrases: [["go on", "继续"]] });
    expect(w[0].phrases).toEqual([]);
  });
  it("hints", () => {
    expect(hint("apple", 0)).toBe("a _ _ _ _");
    expect(hint("apple", 1)).toBe("a _ p _ e");
  });
});
