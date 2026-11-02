import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore, dayTotal } from "../store";
import { dayKey, State } from "../lib/srs";
import { DECKS, deckOf, forDeck } from "../lib/decks";
import { DeckChip } from "../components/DeckChip";

// v1.0.0 curve illustration (schematic, not a lab transcript)
const CURVE = [
  { t: "现在", forget: 100, keep: 100 }, { t: "20分", forget: 58, keep: 94 }, { t: "1时", forget: 44, keep: 92 },
  { t: "1天", forget: 33, keep: 90 }, { t: "2天", forget: 28, keep: 88 }, { t: "6天", forget: 25, keep: 86 }, { t: "1月", forget: 21, keep: 90 },
];

function Curve() {
  const W = 320, H = 150, P = 24;
  const x = (i: number) => P + (i * (W - P * 2)) / (CURVE.length - 1);
  const y = (v: number) => 12 + ((100 - v) * (H - 36)) / 100;
  const path = (k: "forget" | "keep") => CURVE.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="遗忘曲线：不复习时记忆快速下降，按节点复习可保持在 90% 左右">
      {[0, 50, 100].map((v) => <line key={v} x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--k-border)" strokeDasharray={v ? "2 4" : ""} />)}
      <path d={path("forget")} fill="none" stroke="var(--k-subtle)" strokeWidth="1.5" pathLength={1} className="[stroke-dasharray:1] animate-[draw_1.4s_var(--ease-out-soft)_both]" />
      <path d={path("keep")} fill="none" stroke="var(--k-accent)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} className="[stroke-dasharray:1] animate-[draw_1.4s_.2s_var(--ease-out-soft)_both]" />
      {CURVE.map((d, i) => <text key={d.t} x={x(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--k-subtle)">{d.t}</text>)}
    </svg>
  );
}

function Calendar() {
  const log = useStore((s) => s.log);
  const cards = useStore((s) => s.cards);
  const [offset, setOffset] = useState(0);
  const { cells, title } = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + offset);
    const y = base.getFullYear(), m = base.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const dueBy: Record<string, number> = {};
    for (const c of Object.values(cards)) { const k = dayKey(c.due); dueBy[k] = (dueBy[k] ?? 0) + 1; }
    const today = dayKey();
    const cells = Array.from({ length: first + days }, (_, i) => {
      if (i < first) return null;
      const d = i - first + 1;
      const k = dayKey(new Date(y, m, d, 12));
      const e = dayTotal(log[k]);
      return { d, k, n: e.n + e.r, due: k > today ? dueBy[k] ?? 0 : 0, today: k === today };
    });
    return { cells, title: `${y} 年 ${m + 1} 月` };
  }, [log, cards, offset]);
  const shade = (n: number) => (n === 0 ? "" : n < 15 ? "bg-accent/25" : n < 40 ? "bg-accent/55 text-white" : "bg-accent text-white");
  return (
    <div>
      <div className="flex items-center justify-between">
        <button aria-label="上个月" onClick={() => setOffset((o) => o - 1)} className="press grid size-9 place-items-center rounded-full"><ChevronLeft className="size-4" /></button>
        <p className="font-jp">{title}</p>
        <button aria-label="下个月" onClick={() => setOffset((o) => o + 1)} className="press grid size-9 place-items-center rounded-full"><ChevronRight className="size-4" /></button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-subtle">{"日一二三四五六".split("").map((d) => <span key={d}>{d}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c, i) => c ? (
          <div key={c.k} title={c.n ? `${c.k} 学习 ${c.n}` : c.due ? `${c.k} 待复习 ${c.due}` : c.k}
            className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${shade(c.n)} ${c.today ? "ring-1 ring-fg" : ""}`}>
            <span className="font-word leading-none">{c.d}</span>
            {c.due > 0 && <span className="mt-0.5 text-[9px] leading-none text-accent">{c.due}</span>}
          </div>
        ) : <span key={i} />)}
      </div>
      <p className="mt-2 text-[11px] text-subtle">底色越深学得越多 · 小数字 = 那天到期的复习</p>
    </div>
  );
}

export default function Stats() {
  const allCards = useStore((s) => s.cards);
  const log = useStore((s) => s.log);
  const allKnown = useStore((s) => s.known);
  const deckId = useStore((s) => s.settings.deck);
  const deck = deckOf(deckId);
  const cards = useMemo(() => forDeck(allCards, deckId), [allCards, deckId]);
  const known = useMemo(() => forDeck(allKnown, deckId), [allKnown, deckId]);

  const data = useMemo(() => {
    const list = Object.values(cards);
    const st = { learning: 0, young: 0, mature: 0 };
    for (const c of list) {
      if (c.state === State.Learning || c.state === State.Relearning) st.learning++;
      else if (c.stability >= 21) st.mature++;
      else st.young++;
    }
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const end = new Date(); end.setHours(28, 0, 0, 0); end.setDate(end.getDate() + i);
      const start = i === 0 ? 0 : end.getTime() - 864e5;
      return list.filter((c) => c.due > start && c.due <= end.getTime()).length;
    });
    const entries = Object.values(log).map((d) => dayTotal(d, deckId));
    const total = entries.reduce((a, e) => a + e.n + e.r, 0);
    const ok = entries.reduce((a, e) => a + e.ok, 0);
    const minutes = Math.round(entries.reduce((a, e) => a + e.ms, 0) / 60000);
    return { st, forecast, total, acc: total ? Math.round((ok / total) * 100) : 0, minutes, n: list.length };
  }, [cards, log, deckId]);
  const max = Math.max(1, ...data.forecast);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-end justify-between">
        <div><p className="eyebrow">记忆</p><h1 className="mt-1 font-jp text-[32px] leading-tight">遗忘曲线</h1></div>
        <DeckChip />
      </div>
      <p className="text-sm leading-relaxed text-muted">艾宾浩斯在 1885 年发现：刚记住的内容，如果不复习，会先快后慢地忘掉。言叶用 FSRS 算法，把复习放在你快要忘记的那一刻。</p>
      <section className="card p-4">
        <Curve />
        <p className="mt-2 flex gap-4 text-[11px] text-subtle">
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-px w-4 bg-subtle" />不复习</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 bg-accent" />按时复习</span>
          <span>示意数据</span>
        </p>
      </section>

      <div className="grid grid-cols-4 gap-2">
        {[["学习中", data.n], ["已掌握", Object.keys(known).length + data.st.mature], ["累计", data.total], ["正确率", `${data.acc}%`]].map(([l, v]) => (
          <div key={l} className="card px-2 py-3 text-center"><p className="font-word text-xl tabular-nums">{v}</p><p className="text-[11px] text-subtle">{l}</p></div>
        ))}
      </div>

      <section className="card p-4"><Calendar /></section>

      <section className="card p-4">
        <h2 className="text-sm text-muted">你的单词停在哪</h2>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-elevated">
          {data.n > 0 && <>
            <div className="bg-again/70" style={{ width: `${(data.st.learning / data.n) * 100}%` }} />
            <div className="bg-hard/70" style={{ width: `${(data.st.young / data.n) * 100}%` }} />
            <div className="bg-keep" style={{ width: `${(data.st.mature / data.n) * 100}%` }} />
          </>}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-4 text-[11px] text-subtle">
          <span>● 学习中 {data.st.learning}</span><span>● 短期记忆 {data.st.young}</span><span>● 长期记忆 ≥21天 {data.st.mature}</span>
        </p>
      </section>

      <section className="card p-4">
        <h2 className="text-sm text-muted">未来 7 天复习量 · {deck.label}</h2>
        <div className="mt-3 flex h-28 items-end gap-2">
          {data.forecast.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[11px] tabular-nums text-subtle">{v}</span>
              <div className="w-full origin-bottom animate-[grow_.6s_var(--ease-out-soft)_both] rounded-t-md bg-accent/80" style={{ height: `${Math.max(2, (v / max) * 72)}px`, animationDelay: `${i * 40}ms` }} />
              <span className="text-[10px] text-subtle">{["今", "明", "后"][i] ?? `+${i}`}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-sm text-muted">各词书进度 · 学习时长 {data.minutes} 分钟</h2>
        <ul className="mt-3 space-y-2.5 text-sm">
          {DECKS.map((d) => {
            const n = Object.keys(forDeck(allCards, d.id)).length;
            return (
              <li key={d.id} className="flex items-center gap-3">
                <span className="w-12 shrink-0">{d.label}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated"><span className="block h-full rounded-full bg-accent" style={{ width: `${(n / Math.max(1, d.count)) * 100}%` }} /></span>
                <span className="w-24 shrink-0 text-right font-word text-xs tabular-nums text-subtle">{n} / {d.count}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
