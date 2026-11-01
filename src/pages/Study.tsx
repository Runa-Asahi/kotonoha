import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import type { Grade } from "ts-fsrs";
import { useWords } from "../lib/useWords";
import { interleave, previewIntervals, Rating } from "../lib/srs";
import { useDeckState, useToday } from "../lib/today";
import { kanaReading } from "../lib/words";
import { speak } from "../lib/speech";
import { useStore } from "../store";
import { Loading } from "../components/Loading";
import { Meaning } from "../components/Meaning";
import { SpeakButton } from "../components/SpeakButton";

type Phase = "recall" | "answer";
const REQUEUE_GAP = 4;

export default function Study() {
  const { words, error, retry, deck } = useWords();
  const t = useToday(deck.id, words);
  const ds = useDeckState(deck.id);
  const lang = deck.lang;
  const [queue, setQueue] = useState<number[] | null>(null);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>("recall");
  const [choice, setChoice] = useState<Grade | null>(null);
  const [, nav] = useLocation();
  const started = useRef(Date.now());
  const s = useStore();

  // Snapshot the queue once so it doesn't reshuffle while grading.
  useEffect(() => {
    if (t && !queue) setQueue(interleave(t.review, t.fresh));
  }, [t, queue]);

  const byId = useMemo(() => (words ? words : []), [words]);
  const id = queue?.[pos];
  const w = id != null ? byId[id] : undefined;
  const card = id != null ? ds.cards[id] : undefined;
  const sayText = w ? (lang === "ja" ? kanaReading(w) || w.word : w.word) : "";
  const intervals = useMemo(() => (id != null && phase === "answer" ? previewIntervals(card, new Date(), s.settings.retention) : null), [id, card, s.settings.retention, phase]);

  useEffect(() => {
    started.current = Date.now();
    if (w && s.settings.autoSpeak) speak(sayText, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w?.id, pos]);

  const next = useCallback(() => {
    setPhase("recall");
    setChoice(null);
    setPos((p) => p + 1);
  }, []);

  const commit = useCallback(
    (g: Grade) => {
      if (id == null) return;
      s.grade(deck.id, id, g, Date.now() - started.current);
      if (g === Rating.Again) {
        // 墨墨-style: forgotten words come back later in the same session.
        setQueue((q) => {
          if (!q) return q;
          const c = [...q];
          c.splice(Math.min(pos + 1 + REQUEUE_GAP, c.length), 0, id);
          return c;
        });
      }
    },
    [id, pos, s, deck.id],
  );

  const choose = useCallback(
    (g: Grade) => {
      setChoice(g);
      setPhase("answer");
    },
    [],
  );

  const confirm = useCallback(
    (g: Grade) => {
      commit(g);
      next();
    },
    [commit, next],
  );

  const tooEasy = () => {
    if (id == null) return;
    s.markKnown(deck.id, id);
    next();
  };

  const undo = () => {
    const back = s.undoLast();
    if (back == null || pos === 0) return;
    setQueue((q) => {
      if (!q) return q;
      // remove a requeued copy if the undone grade was "忘记"
      const c = [...q];
      const dup = c.indexOf(back, pos);
      if (dup > -1) c.splice(dup, 1);
      return c;
    });
    setPos((p) => p - 1);
    setPhase("recall");
    setChoice(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (phase === "recall") {
        if (e.key === "1") choose(Rating.Good);
        if (e.key === "2") choose(Rating.Hard);
        if (e.key === "3") choose(Rating.Again);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        confirm(choice ?? Rating.Good);
      } else if (e.key === "x" && choice === Rating.Good) confirm(Rating.Again);
      if (e.key === "r" && w) speak(sayText, lang);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, choice, choose, confirm, w, sayText, lang]);

  if (!queue) return <Loading error={error} retry={retry} />;

  if (!w) {
    const today = s.log[Object.keys(s.log).sort().pop() ?? ""]?.[deck.id];
    return (
      <div className="card mt-10 space-y-4 p-8 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="text-xl font-bold">{queue.length ? "本轮完成！" : "暂时没有要学的词"}</h1>
        {today && today.n + today.r > 0 && (
          <p className="text-slate-500">今日新学 {today.n} · 复习 {today.r} · 正确率 {Math.round((today.ok / (today.n + today.r)) * 100)}%</p>
        )}
        <div className="flex gap-3">
          <Link href="/spell" className="btn-ghost flex-1">拼写巩固</Link>
          <button className="btn-primary flex-1" onClick={() => nav("/")}>返回</button>
        </div>
      </div>
    );
  }

  const isNew = !card;
  const remaining = queue.length - pos;
  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <header className="flex items-center gap-3 py-2">
        <Link href="/" aria-label="退出学习" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✕</Link>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${(pos / queue.length) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-slate-500" aria-label={`剩余 ${remaining} 个`}>{remaining}</span>
        <button onClick={undo} disabled={!s.undo || pos === 0} className="rounded-lg px-2 py-1 text-sm text-slate-500 disabled:opacity-30" aria-label="撤销上一个">撤销</button>
      </header>

      <section aria-live="polite" className="card mt-2 flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between">
          <span className={`rounded-full px-2 py-0.5 text-xs ${isNew ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-800"}`}>{isNew ? "新词" : "复习"}</span>
          <span className="text-xs text-slate-400">{deck.level}</span>
          <button onClick={() => s.toggleStar(deck.id, w.id)} aria-pressed={!!ds.starred[w.id]} aria-label="收藏" className="text-xl">{ds.starred[w.id] ? "★" : "☆"}</button>
        </div>
        <div className="mt-8 text-center">
          <h1 lang={lang} className="break-words text-4xl font-bold tracking-tight">{w.word}</h1>
          {w.reading && (lang === "en" || phase === "answer") && <p lang={lang} className="mt-1 text-slate-500">{w.reading}</p>}
          <SpeakButton text={sayText} lang={lang} className="mt-2" />
        </div>
        {phase === "answer" ? (
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <Meaning w={w} lang={lang} />
          </div>
        ) : (
          <p className="mt-auto pb-4 text-center text-sm text-slate-400">先在心里回忆它的意思</p>
        )}
      </section>

      <div className="sticky bottom-0 grid gap-3 bg-slate-50 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-950">
        {phase === "recall" ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <button className="btn bg-emerald-600 text-white" onClick={() => choose(Rating.Good)}>认识<kbd className="sr-only">1</kbd></button>
              <button className="btn bg-amber-500 text-white" onClick={() => choose(Rating.Hard)}>模糊<kbd className="sr-only">2</kbd></button>
              <button className="btn bg-rose-500 text-white" onClick={() => choose(Rating.Again)}>忘记<kbd className="sr-only">3</kbd></button>
            </div>
            <button className="text-sm text-slate-500 underline-offset-2 hover:underline" onClick={tooEasy}>太简单，以后不再出现</button>
          </>
        ) : choice === Rating.Good ? (
          <div className="grid grid-cols-3 gap-3">
            <button className="btn-ghost" onClick={() => confirm(Rating.Again)}>记错了</button>
            <button className="btn-ghost flex-col gap-0 text-sm" onClick={() => confirm(Rating.Easy)}>很简单<span className="text-xs opacity-60">{intervals?.[Rating.Easy]}</span></button>
            <button className="btn-primary flex-col gap-0" onClick={() => confirm(Rating.Good)}>下一个<span className="text-xs opacity-80">{intervals?.[Rating.Good]}</span></button>
          </div>
        ) : (
          <button className="btn-primary w-full" onClick={() => confirm(choice!)}>
            下一个<span className="text-xs opacity-80">{choice === Rating.Again ? "稍后再现" : intervals?.[choice!]}</span>
          </button>
        )}
      </div>
    </div>
  );
}
