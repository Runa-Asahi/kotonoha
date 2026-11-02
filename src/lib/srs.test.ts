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
    expect(w[1]).toEqual({ id: 1, word: "go", meaning: "v. 去", phrases: [["go on", "继续"]], reading: "" });
    expect(w[0].phrases).toEqual([]);
  });
  it("hints", () => {
    expect(hint("apple", 0)).toBe("a _ _ _ _");
    expect(hint("apple", 1)).toBe("a _ p _ e");
  });
});

import { migrateV1 } from "../store";
import { forDeck, DECKS } from "./decks";
import { makeQuiz, SEION, storyPool } from "./kanaQuiz";
import { arpaToIpa } from "../../scripts/ipa.mjs";
import { retrievability } from "./srs";
import { streak } from "../pages/Home";
import { answerOf } from "../pages/Spell";

describe("decks & migration", () => {
  it("migrates v2.0.0 TOEFL-only data to deck-scoped keys", () => {
    const m = migrateV1({ cards: { 5: { due: 1 } }, known: { 7: true }, starred: {}, log: { "2026-11-01": { n: 3, r: 1, ok: 2, ms: 10 } }, settings: { dailyNew: 30 } });
    expect(Object.keys(m.cards)).toEqual(["toefl:5"]);
    expect(Object.keys(m.known)).toEqual(["toefl:7"]);
    expect(m.log["2026-11-01"].toefl?.n).toBe(3);
    expect(m.settings.deck).toBe("toefl");
    expect(m.settings.dailyNew).toBe(30);
  });
  it("forDeck separates progress per word book", () => {
    const r = forDeck({ "toefl:1": "a", "n3:1": "b", "n3:22": "c" }, "n3");
    expect(r).toEqual({ 1: "b", 22: "c" });
  });
  it("has all word books with counts", () => {
    expect(DECKS.map((d) => d.id)).toEqual(["toefl", "cet6", "n5", "n4", "n3", "n2", "n1"]);
    for (const d of DECKS) expect(d.count).toBeGreaterThan(500);
  });
  it("parses curated extra fields and Japanese reading answers", () => {
    const [w] = parseWords([["経験", "名词 经验", [], "けいけん", ["例", "例子", "钩子", "経=经过|験=检验"], "keiken"]], "ja");
    expect(w.parts).toEqual([{ t: "経", g: "经过" }, { t: "験", g: "检验" }]);
    expect(answerOf(w, "ja")).toBe("けいけん");
    expect(answerOf({ ...w, reading: "" }, "ja")).toBe("経験");
  });
});

describe("kana quiz", () => {
  it("builds unique questions with the answer among 4 distinct choices", () => {
    const q = makeQuiz(SEION, 20);
    expect(q).toHaveLength(20);
    expect(new Set(q.map((x) => x.item.hira)).size).toBe(20);
    for (const x of q) {
      expect(x.choices).toHaveLength(4);
      expect(x.choices).toContain(x.item);
      expect(new Set(x.choices.map((c) => c.romaji)).size).toBe(4);
    }
  });
  it("storyboard pool has a story for every kana", () => {
    for (const k of storyPool()) expect(k.shot.length).toBeGreaterThan(5);
  });
});

describe("pronunciation data", () => {
  it("converts CMUdict ARPAbet to IPA with onset stress", () => {
    expect(arpaToIpa("S T R AE1 T AH0 JH IY0")).toBe("ˈstrætədʒi");
    expect(arpaToIpa("AE0 B S T R AE1 K T")).toBe("æbˈstrækt");
    expect(arpaToIpa("B AE1 K")).toBe("bæk");
  });
  it("parses IPA, romaji and word forms", () => {
    const [en] = parseWords([["go", "v. 去", [], "ɡoʊ", 0, "ɡəʊ", "p:went/d:gone/i:going/3:goes"]], "en");
    expect(en.ipaUS).toBe("ɡoʊ");
    expect(en.ipaUK).toBe("ɡəʊ");
    expect(en.forms?.[0]).toEqual(["过去式", "went"]);
    const [ja] = parseWords([["経験", "experience", [], "けいけん", 0, "keiken"]], "ja");
    expect(ja.reading).toBe("けいけん");
    expect(ja.romaji).toBe("keiken");
  });
  it("retrievability decays from ~100% toward the target at the due date", () => {
    const c = review(undefined, Rating.Good, new Date(0));
    const r0 = retrievability({ ...c, last_review: 0, stability: 10 }, 0);
    const r10 = retrievability({ ...c, last_review: 0, stability: 10 }, 10 * 864e5);
    expect(r0).toBeCloseTo(1, 3);
    expect(r10).toBeCloseTo(0.9, 2);
  });
  it("streak counts consecutive study days", () => {
    const now = new Date("2026-11-02T12:00:00").getTime();
    const log = { [dayKey(now)]: { toefl: { n: 1, r: 0, ok: 1, ms: 0 } }, [dayKey(now - 864e5)]: { n3: { n: 0, r: 2, ok: 2, ms: 0 } } };
    expect(streak(log, now)).toBe(2);
  });
});
