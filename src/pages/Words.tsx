import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Search, Star } from "lucide-react";
import { useWords } from "../lib/useWords";
import { useDeckState } from "../lib/today";
import { Loading } from "../components/Loading";
import { DeckChip } from "../components/DeckChip";

type Filter = "all" | "learning" | "new" | "starred" | "known";
const PAGE = 50;

export default function Words() {
  const { words, error, retry, deck } = useWords();
  const { cards, known, starred } = useDeckState(deck.id);
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE);
  const dq = useDeferredValue(q.trim().toLowerCase());
  const more = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    if (!words) return [];
    return words.filter((w) => {
      if (f === "learning" && !cards[w.id]) return false;
      if (f === "new" && (cards[w.id] || known[w.id])) return false;
      if (f === "starred" && !starred[w.id]) return false;
      if (f === "known" && !known[w.id]) return false;
      return !dq || w.word.toLowerCase().startsWith(dq) || w.reading.startsWith(dq) || (w.romaji ?? "").startsWith(dq) || w.meaning.toLowerCase().includes(dq);
    });
  }, [words, f, dq, cards, known, starred]);

  // infinite scroll
  useEffect(() => {
    const el = more.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setLimit((l) => l + PAGE), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [list.length]);

  const tabs: [Filter, string][] = [["all", "全部"], ["learning", "学习中"], ["new", "未学"], ["starred", "收藏"], ["known", "已掌握"]];
  return (
    <div className="pt-2">
      <div className="flex items-end justify-between">
        <div><p className="eyebrow">词库</p><h1 className="mt-1 font-jp text-[32px] leading-tight">单词本</h1></div>
        <DeckChip />
      </div>
      <label className="mt-5 flex h-12 items-center gap-2 rounded-2xl border border-border bg-surface px-4">
        <Search className="size-4 text-subtle" />
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} aria-label="搜索单词"
          placeholder={deck.lang === "ja" ? "日文、假名、罗马音或释义" : "英文或中文释义"} className="h-full flex-1 bg-transparent outline-none placeholder:text-subtle" />
      </label>
      <div role="tablist" className="scroll-x -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={f === k} onClick={() => { setF(k); setLimit(PAGE); }}
            className={`press shrink-0 rounded-full border px-3.5 py-1.5 text-sm ${f === k ? "border-transparent bg-ink text-ink-fg" : "border-border text-muted"}`}>{l}</button>
        ))}
      </div>
      {!words ? <Loading error={error} retry={retry} /> : (
        <>
          <p className="mt-3 text-xs text-subtle">{list.length.toLocaleString()} 个词</p>
          <ul className="mt-1">
            {list.slice(0, limit).map((w) => (
              <li key={w.id} className="cv-auto border-b border-border">
                <Link href={`/words/${w.id}`} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span lang={deck.lang} className={`truncate text-lg ${deck.lang === "ja" ? "font-jp" : "font-word"}`}>{w.word}</span>
                      <span className="truncate text-xs text-subtle">{deck.lang === "ja" ? `${w.reading}${w.romaji ? " · " + w.romaji : ""}` : w.ipaUS ? `/${w.ipaUS}/` : ""}</span>
                    </span>
                    <span className="block truncate text-sm text-muted">{w.meaning.replace(/^(名词|动词|形容词|副词|形容动词|连词)\s+/, "")}</span>
                  </span>
                  {starred[w.id] && <Star className="size-4 fill-accent text-accent" />}
                  {cards[w.id] && <span className="size-1.5 rounded-full bg-accent" aria-label="学习中" />}
                  {known[w.id] && <span className="text-[11px] text-subtle">已掌握</span>}
                </Link>
              </li>
            ))}
          </ul>
          {limit < list.length && <div ref={more} className="py-6 text-center text-xs text-subtle">…</div>}
          {list.length === 0 && <p className="mt-10 text-center text-sm text-muted">没有找到。换个词，或切换词书。</p>}
        </>
      )}
    </div>
  );
}
