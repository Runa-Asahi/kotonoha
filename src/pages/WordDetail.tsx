import { useState } from "react";
import { Link, useParams } from "wouter";
import { useWords } from "../lib/useWords";
import { useStore } from "../store";
import { Loading } from "../components/Loading";
import { Meaning } from "../components/Meaning";
import { SpeakButton } from "../components/SpeakButton";
import { formatInterval } from "../lib/srs";
import { useDeckState } from "../lib/today";
import { kanaReading } from "../lib/words";

const STATE = ["新词", "学习中", "复习中", "重学中"];

export default function WordDetail() {
  const { id } = useParams<{ id: string }>();
  const { words, error, retry, deck } = useWords();
  const s = useStore();
  const ds = useDeckState(deck.id);
  const [now] = useState(() => Date.now());
  if (!words) return <Loading error={error} retry={retry} />;
  const w = words[Number(id)];
  if (!w) return <div className="card mt-10 p-8 text-center">找不到这个单词 <Link href="/words" className="btn-primary mt-4">返回词库</Link></div>;
  const c = ds.cards[w.id];
  const lang = deck.lang;
  return (
    <div className="space-y-4">
      <Link href="/words" className="inline-block pt-2 text-sm text-brand-600">← 词库</Link>
      <article className="card space-y-5 p-6">
        <div className="flex items-center gap-2">
          <div><h1 lang={lang} className="text-3xl font-bold">{w.word}</h1>{w.reading && <p lang={lang} className="text-slate-500">{w.reading}</p>}</div>
          <SpeakButton text={lang === "ja" ? kanaReading(w) || w.word : w.word} lang={lang} />
          <button onClick={() => s.toggleStar(deck.id, w.id)} aria-pressed={!!ds.starred[w.id]} aria-label="收藏" className="ml-auto text-2xl">{ds.starred[w.id] ? "★" : "☆"}</button>
        </div>
        <Meaning w={w} lang={lang} />
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {ds.known[w.id] ? "已标记为掌握，不会安排复习。" : c ? (
            <>状态：{STATE[c.state]} · 复习 {c.reps} 次 · 遗忘 {c.lapses} 次<br />
              记忆稳定性 {c.stability.toFixed(1)} 天 · 下次复习 {c.due <= now ? "现在" : formatInterval(c.due - now) + "后"}</>
          ) : "尚未学习"}
        </div>
        {!ds.known[w.id] && <button className="btn-ghost w-full" onClick={() => s.markKnown(deck.id, w.id)}>标记为已掌握</button>}
      </article>
    </div>
  );
}
