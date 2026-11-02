import { useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronLeft, Star } from "lucide-react";
import { useWords } from "../lib/useWords";
import { useStore } from "../store";
import { Loading } from "../components/Loading";
import { WordFace } from "../components/WordFace";
import { Pronounce } from "../components/Pronounce";
import { formatInterval, retrievability } from "../lib/srs";
import { useDeckState } from "../lib/today";

const STATE = ["新词", "学习中", "复习中", "重学中"];

export default function WordDetail() {
  const { id } = useParams<{ id: string }>();
  const { words, error, retry, deck } = useWords();
  const s = useStore();
  const ds = useDeckState(deck.id);
  const [now] = useState(() => Date.now());
  if (!words) return <Loading error={error} retry={retry} />;
  const w = words[Number(id)];
  if (!w) return <div className="card mt-10 p-8 text-center">找不到这个单词<Link href="/words" className="btn-ink mt-4 w-full">返回词库</Link></div>;
  const c = ds.cards[w.id];
  const lang = deck.lang;
  const r = c ? Math.round(retrievability(c, now) * 100) : 0;
  return (
    <div className="pt-1">
      <div className="flex items-center justify-between">
        <button onClick={() => history.back()} className="press -ml-2 inline-flex h-11 items-center gap-0.5 pr-2 text-sm text-muted"><ChevronLeft className="size-4" />词库</button>
        <button onClick={() => s.toggleStar(deck.id, w.id)} aria-pressed={!!ds.starred[w.id]} aria-label="收藏" className="press p-2">
          <Star className={`size-5 ${ds.starred[w.id] ? "fill-accent text-accent" : "text-subtle"}`} strokeWidth={1.6} />
        </button>
      </div>
      <article className="card mt-2 p-5">
        <p className="text-xs text-subtle">{deck.level}</p>
        <h1 lang={lang} className={`mt-2 break-words text-5xl leading-tight ${lang === "ja" ? "font-jp" : "font-word"}`}>{w.word}</h1>
        <Pronounce w={w} lang={lang} />
        <div className="mt-5"><WordFace w={w} lang={lang} /></div>
      </article>
      <section className="card mt-3 p-5">
        <h2 className="eyebrow">记忆状态</h2>
        {ds.known[w.id] ? <p className="mt-2 text-sm text-muted">已标记为掌握，不会安排复习。</p> : c ? (
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div><dt className="text-[11px] text-subtle">状态</dt><dd className="mt-1 text-sm">{STATE[c.state]}</dd></div>
            <div><dt className="text-[11px] text-subtle">当前记忆率</dt><dd className="mt-1 font-word text-xl">{r}%</dd></div>
            <div><dt className="text-[11px] text-subtle">下次复习</dt><dd className="mt-1 text-sm">{c.due <= now ? "现在" : formatInterval(c.due - now) + "后"}</dd></div>
            <div><dt className="text-[11px] text-subtle">复习次数</dt><dd className="mt-1 font-word text-xl">{c.reps}</dd></div>
            <div><dt className="text-[11px] text-subtle">遗忘</dt><dd className="mt-1 font-word text-xl">{c.lapses}</dd></div>
            <div><dt className="text-[11px] text-subtle">稳定性</dt><dd className="mt-1 font-word text-xl">{c.stability.toFixed(1)}<span className="text-xs">天</span></dd></div>
          </dl>
        ) : <p className="mt-2 text-sm text-muted">还没学过。会按词书顺序出现在每日新词里。</p>}
        {!ds.known[w.id] && <button className="btn-line mt-4 w-full" onClick={() => s.markKnown(deck.id, w.id)}>标记为已掌握</button>}
      </section>
    </div>
  );
}
