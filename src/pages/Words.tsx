import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "wouter";
import { useWords } from "../lib/useWords";
import { useDeckState } from "../lib/today";
import { DeckSwitcher } from "../components/DeckSwitcher";
import { Loading } from "../components/Loading";

type Filter = "all" | "learning" | "new" | "starred" | "known";
const PAGE = 60;

export default function Words() {
  const { words, error, retry, deck } = useWords();
  const { cards, known, starred } = useDeckState(deck.id);
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE);
  const dq = useDeferredValue(q.trim().toLowerCase());

  const list = useMemo(() => {
    if (!words) return [];
    return words.filter((w) => {
      if (f === "learning" && !cards[w.id]) return false;
      if (f === "new" && (cards[w.id] || known[w.id])) return false;
      if (f === "starred" && !starred[w.id]) return false;
      if (f === "known" && !known[w.id]) return false;
      return !dq || w.word.toLowerCase().startsWith(dq) || w.reading.startsWith(dq) || w.meaning.toLowerCase().includes(dq);
    });
  }, [words, f, dq, cards, known, starred]);

  const head = (<><h1 className="pt-2 text-2xl font-bold">词库</h1><DeckSwitcher /></>);
  if (!words) return <div className="space-y-3">{head}<Loading error={error} retry={retry} /></div>;
  const tabs: [Filter, string][] = [["all", "全部"], ["learning", "学习中"], ["new", "未学"], ["starred", "收藏"], ["known", "已掌握"]];
  return (
    <div className="space-y-3">
      {head}
      <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder={deck.lang === "ja" ? "搜索日文、假名或释义…" : "搜索英文或中文…"} aria-label="搜索单词"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900" />
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={f === k} onClick={() => { setF(k); setLimit(PAGE); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${f === k ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{l}</button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{list.length.toLocaleString()} 个结果</p>
      <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
        {list.slice(0, limit).map((w) => (
          <li key={w.id}>
            <Link href={`/words/${w.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span lang={deck.lang} className="w-32 shrink-0 truncate font-medium">{w.word}{deck.lang === "ja" && w.reading && <span className="block truncate text-xs font-normal text-slate-400">{w.reading}</span>}</span>
              <span className="flex-1 truncate text-sm text-slate-500">{w.meaning}</span>
              {cards[w.id] && <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="学习中" />}
              {known[w.id] && <span className="text-xs text-slate-400">已掌握</span>}
            </Link>
          </li>
        ))}
      </ul>
      {limit < list.length && <button className="btn-ghost w-full" onClick={() => setLimit((l) => l + PAGE * 2)}>加载更多</button>}
    </div>
  );
}
