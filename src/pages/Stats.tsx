import { useMemo } from "react";
import { useStore, dayTotal } from "../store";
import { dayKey, State } from "../lib/srs";
import { DECKS, deckOf, forDeck } from "../lib/decks";
import { DeckSwitcher } from "../components/DeckSwitcher";

const WEEKS = 20;

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
    const byState = { learning: 0, young: 0, mature: 0 };
    for (const c of list) {
      if (c.state === State.Learning || c.state === State.Relearning) byState.learning++;
      else if (c.stability >= 21) byState.mature++;
      else byState.young++;
    }
    const now = Date.now();
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const end = new Date(); end.setHours(28, 0, 0, 0); end.setDate(end.getDate() + i);
      const start = i === 0 ? 0 : end.getTime() - 864e5;
      return list.filter((c) => c.due > start && c.due <= end.getTime()).length;
    });
    const entries = Object.values(log).map((d) => dayTotal(d, deckId));
    const totalReviews = entries.reduce((a, e) => a + e.n + e.r, 0);
    const totalOk = entries.reduce((a, e) => a + e.ok, 0);
    const minutes = Math.round(entries.reduce((a, e) => a + e.ms, 0) / 60000);
    const days: { k: string; v: number }[] = [];
    const d = new Date(now);
    d.setDate(d.getDate() - (WEEKS * 7 - 1) - d.getDay());
    for (let i = 0; i < WEEKS * 7; i++) {
      const k = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i, 12));
      const e = dayTotal(log[k]);
      days.push({ k, v: e.n + e.r });
    }
    return { byState, forecast, totalReviews, acc: totalReviews ? Math.round((totalOk / totalReviews) * 100) : 0, minutes, days, total: list.length };
  }, [cards, log, deckId]);

  const shade = (v: number) => (v === 0 ? "bg-slate-200 dark:bg-slate-800" : v < 10 ? "bg-brand-100" : v < 30 ? "bg-brand-500/60" : v < 60 ? "bg-brand-500" : "bg-brand-700");
  const max = Math.max(1, ...data.forecast);
  const wd = ["今天", "明天", "后天"];
  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold">统计</h1>
      <DeckSwitcher />
      <p className="text-xs text-slate-500">以下为「{deck.label}」的数据；热力图为全部词书合计。</p>
      <div className="grid grid-cols-2 gap-3">
        {[["学习中的词", data.total], ["已掌握", Object.keys(known).length + data.byState.mature], ["累计复习", data.totalReviews], ["正确率", `${data.acc}%`]].map(([l, v]) => (
          <div key={l} className="card p-4"><p className="text-2xl font-bold">{v}</p><p className="text-xs text-slate-500">{l}</p></div>
        ))}
      </div>
      <section className="card p-5">
        <h2 className="text-sm font-medium text-slate-500">学习热力图（近 {WEEKS} 周）· 累计 {data.minutes} 分钟</h2>
        <div className="mt-3 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
          {data.days.map((d) => <div key={d.k} title={`${d.k}：${d.v} 次`} aria-label={`${d.k} ${d.v} 次`} className={`aspect-square min-w-2.5 rounded-sm ${shade(d.v)}`} />)}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="text-sm font-medium text-slate-500">记忆阶段</h2>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {data.total > 0 && <>
            <div className="bg-rose-400" style={{ width: `${(data.byState.learning / data.total) * 100}%` }} />
            <div className="bg-amber-400" style={{ width: `${(data.byState.young / data.total) * 100}%` }} />
            <div className="bg-emerald-500" style={{ width: `${(data.byState.mature / data.total) * 100}%` }} />
          </>}
        </div>
        <p className="mt-2 flex gap-4 text-xs text-slate-500">
          <span>🔴 学习中 {data.byState.learning}</span><span>🟡 短期 {data.byState.young}</span><span>🟢 长期（≥21天）{data.byState.mature}</span>
        </p>
      </section>
      <section className="card p-5">
        <h2 className="text-sm font-medium text-slate-500">各词书进度</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {DECKS.map((d) => {
            const n = Object.keys(forDeck(allCards, d.id)).length;
            return (
              <li key={d.id} className="flex items-center gap-3">
                <span className="w-14 shrink-0">{d.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><span className="block h-full bg-brand-500" style={{ width: `${(n / Math.max(1, d.count)) * 100}%` }} /></span>
                <span className="w-24 shrink-0 text-right tabular-nums text-slate-500">{n}/{d.count}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="card p-5">
        <h2 className="text-sm font-medium text-slate-500">未来 7 天复习量</h2>
        <div className="mt-3 flex h-28 items-end gap-2">
          {data.forecast.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs tabular-nums text-slate-500">{v}</span>
              <div className="w-full rounded-t bg-brand-500" style={{ height: `${(v / max) * 70}px` }} />
              <span className="text-[10px] text-slate-400">{wd[i] ?? `+${i}天`}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
