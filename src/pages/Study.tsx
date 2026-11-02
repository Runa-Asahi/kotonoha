import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { ChevronLeft, Lightbulb, Star, Undo2 } from "lucide-react";
import type { Grade } from "ts-fsrs";
import { useWords } from "../lib/useWords";
import { useDeckState, useToday } from "../lib/today";
import { interleave, previewIntervals, Rating, State } from "../lib/srs";
import { speak, stopSpeaking } from "../lib/speech";
import { haptic } from "../lib/haptics";
import { useStore } from "../store";
import { Loading } from "../components/Loading";
import { Pronounce } from "../components/Pronounce";
import { Mnemonic, WordFace } from "../components/WordFace";
import type { Word } from "../lib/words";

type Phase = "recall" | "answer";
const REQUEUE_GAP = 4;
const SWIPE = 90;
const STAGE = ["新词", "学习中", "复习", "重学"];

function Hint({ w, lang }: { w: Word; lang: "en" | "ja" }) {
  if (w.parts?.length || w.hook) return <Mnemonic w={w} lang={lang} />;
  if (w.example) {
    const masked = w.example.split(w.word).join("＿＿");
    return <p lang={lang} className="border-t border-border pt-3 text-sm text-muted">{masked}</p>;
  }
  if (w.phrases[0]) return <p className="border-t border-border pt-3 text-sm text-muted">{w.phrases[0][0]}</p>;
  if (w.forms?.length) return <p className="border-t border-border pt-3 text-sm text-muted">{w.forms.map((f) => f[1]).join(" · ")}</p>;
  return <p className="border-t border-border pt-3 text-sm text-subtle">这个词没有更多提示，凭感觉选吧。</p>;
}

function SwipeCard({ children, onSwipe, dir }: { children: React.ReactNode; onSwipe: (d: 1 | -1) => void; dir: number }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-7, 7]);
  const yes = useTransform(x, [20, SWIPE], [0, 1]);
  const no = useTransform(x, [-SWIPE, -20], [1, 0]);
  return (
    <motion.article
      className="card relative flex min-h-[52dvh] flex-1 flex-col p-5 will-change-transform touch-pan-y select-none"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={(_: unknown, i: PanInfo) => {
        if (i.offset.x > SWIPE || i.velocity.x > 650) onSwipe(1);
        else if (i.offset.x < -SWIPE || i.velocity.x < -650) onSwipe(-1);
      }}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: dir * 420, rotate: dir * 10, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    >
      <motion.span aria-hidden style={{ opacity: yes }} className="hanko pointer-events-none absolute top-5 left-5 z-10 px-2 py-1 text-sm !border-keep !text-keep">认识</motion.span>
      <motion.span aria-hidden style={{ opacity: no }} className="hanko pointer-events-none absolute top-5 right-5 z-10 px-2 py-1 text-sm !border-again !text-again">忘记</motion.span>
      {children}
    </motion.article>
  );
}

export default function Study() {
  const { words, error, retry, deck } = useWords();
  const t = useToday(deck.id, words);
  const ds = useDeckState(deck.id);
  const lang = deck.lang;
  const [queue, setQueue] = useState<number[] | null>(null);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>("recall");
  const [choice, setChoice] = useState<Grade | null>(null);
  const [hint, setHint] = useState(false);
  const [dir, setDir] = useState(1);
  const [misses, setMisses] = useState(0);
  const [, nav] = useLocation();
  const started = useRef(Date.now());
  const s = useStore();

  useEffect(() => {
    if (t && !queue) setQueue(interleave(t.review, t.fresh));
  }, [t, queue]);
  useEffect(() => () => stopSpeaking(), []);

  const id = queue?.[pos];
  const w = id != null && words ? words[id] : undefined;
  const card = id != null ? ds.cards[id] : undefined;
  const say = w ? (lang === "ja" ? w.reading || w.word : w.word) : "";
  const intervals = useMemo(() => (id != null && phase === "answer" ? previewIntervals(card, new Date(), s.settings.retention) : null), [id, card, s.settings.retention, phase]);

  useEffect(() => {
    started.current = Date.now();
    if (w && s.settings.autoSpeak) speak(say, lang, s.settings.accent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w?.id, pos]);

  const advance = useCallback((d: number) => {
    setDir(d);
    setPhase("recall");
    setChoice(null);
    setHint(false);
    setPos((p) => p + 1);
  }, []);

  const confirm = useCallback(
    (g: Grade, d = 1) => {
      if (id == null) return;
      s.grade(deck.id, id, g, Date.now() - started.current);
      haptic(g === Rating.Again ? "error" : "success");
      if (g === Rating.Again) {
        setMisses((m) => m + 1);
        setQueue((q) => {
          if (!q) return q;
          const c = [...q];
          c.splice(Math.min(pos + 1 + REQUEUE_GAP, c.length), 0, id);
          return c;
        });
      }
      advance(g === Rating.Again ? -1 : d);
    },
    [id, pos, s, deck.id, advance],
  );

  const choose = useCallback((g: Grade) => {
    haptic("light");
    setChoice(g);
    setPhase("answer");
  }, []);

  const onSwipe = (d: 1 | -1) => {
    if (phase === "recall") {
      if (d === 1) choose(Rating.Good);
      else choose(Rating.Again);
    } else if (d === 1) confirm(choice ?? Rating.Good, 1);
    else confirm(choice === Rating.Good ? Rating.Again : (choice ?? Rating.Again), -1);
  };

  const undo = () => {
    const back = s.undoLast();
    if (back == null || pos === 0) return;
    haptic("medium");
    setQueue((q) => {
      if (!q) return q;
      const c = [...q];
      const dup = c.indexOf(back, pos);
      if (dup > -1) c.splice(dup, 1);
      return c;
    });
    setDir(-1);
    setPos((p) => p - 1);
    setPhase("recall");
    setChoice(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (phase === "recall") {
        if (e.key === "1" || e.key === "ArrowRight") choose(Rating.Good);
        if (e.key === "2") choose(Rating.Hard);
        if (e.key === "3" || e.key === "ArrowLeft") choose(Rating.Again);
        if (e.key === "h") setHint(true);
      } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        confirm(choice ?? Rating.Good);
      } else if ((e.key === "x" || e.key === "ArrowLeft") && choice === Rating.Good) confirm(Rating.Again, -1);
      if (e.key === "r" && w) speak(say, lang, s.settings.accent);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, choice, choose, confirm, w, say, lang, s.settings.accent]);

  if (!queue) return <Loading error={error} retry={retry} />;

  if (!w) {
    const today = s.log[Object.keys(s.log).sort().pop() ?? ""]?.[deck.id];
    const total = today ? today.n + today.r : 0;
    return (
      <div className="pt-10 text-center">
        <span className="hanko mx-auto size-20 animate-[stamp_.6s_var(--ease-out-soft)_both] text-4xl">{queue.length ? "済" : "休"}</span>
        <h1 className="mt-6 font-jp text-3xl">{queue.length ? "这组完成了" : "现在没有要学的词"}</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
          {queue.length
            ? `过了 ${queue.length} 张，忘记 ${misses} 次。忘了的词已经排到后面又看了一遍。`
            : "今天的任务都做完了。回到今日可以再学 10 个，或换一本词书。"}
        </p>
        {total > 0 && (
          <dl className="card mx-auto mt-6 grid max-w-xs grid-cols-3 py-4">
            <div><dt className="text-xs text-subtle">新学</dt><dd className="font-word text-2xl">{today!.n}</dd></div>
            <div><dt className="text-xs text-subtle">复习</dt><dd className="font-word text-2xl">{today!.r}</dd></div>
            <div><dt className="text-xs text-subtle">正确率</dt><dd className="font-word text-2xl">{Math.round((today!.ok / total) * 100)}%</dd></div>
          </dl>
        )}
        <div className="mx-auto mt-8 grid max-w-xs gap-3">
          <button className="btn-ink" onClick={() => nav("/")}>回到今日</button>
          <Link href="/spell" className="btn-line">{lang === "ja" ? "读音巩固" : "拼写巩固"}</Link>
        </div>
      </div>
    );
  }

  const long = w.word.length > 11;
  const remaining = queue.length - pos;
  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col">
      <header className="flex items-center gap-2 py-1">
        <Link href="/" className="press -ml-2 inline-flex h-11 items-center gap-0.5 pr-2 text-sm text-muted"><ChevronLeft className="size-4" />今日</Link>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(pos / queue.length) * 100}%` }} />
        </div>
        <span className="w-10 text-right text-sm tabular-nums text-muted" aria-label={`剩余 ${remaining} 张`}>{remaining}</span>
        <button onClick={undo} disabled={!s.undo || pos === 0} aria-label="撤销上一张" className="press grid size-10 place-items-center rounded-full text-muted disabled:opacity-25"><Undo2 className="size-[18px]" /></button>
      </header>

      <div className="relative mt-3 flex flex-1 flex-col">
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <SwipeCard key={`${pos}-${id}`} onSwipe={onSwipe} dir={dir}>
            <div className="flex items-start justify-between">
              <p className="text-xs text-subtle">{deck.level} · {card ? STAGE[card.state] ?? "复习" : "新词"}{card && card.state === State.Review ? ` · 第 ${card.reps} 次` : ""}</p>
              <button onClick={() => s.toggleStar(deck.id, w.id)} aria-pressed={!!ds.starred[w.id]} aria-label="收藏" className="press -m-2 p-2">
                <Star className={`size-5 ${ds.starred[w.id] ? "fill-accent text-accent" : "text-subtle"}`} strokeWidth={1.6} />
              </button>
            </div>
            <h1 lang={lang} className={`mt-6 break-words leading-[1.05] ${lang === "ja" ? "font-jp" : "font-word"} ${long ? "text-4xl" : "text-[54px]"}`}>{w.word}</h1>
            <Pronounce w={w} lang={lang} showReading={lang === "en" || phase === "answer" || hint} />
            <div className="mt-5 flex-1">
              <AnimatePresence initial={false} mode="wait">
                {phase === "answer" ? (
                  <motion.div key="a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <WordFace w={w} lang={lang} />
                  </motion.div>
                ) : hint ? (
                  <motion.div key="h" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><Hint w={w} lang={lang} /></motion.div>
                ) : (
                  <motion.p key="r" exit={{ opacity: 0 }} className="pt-10 text-center text-sm text-subtle">先在心里想一想它的意思<br /><span className="text-[11px]">右滑 认识 · 左滑 忘记</span></motion.p>
                )}
              </AnimatePresence>
            </div>
          </SwipeCard>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-bg via-bg to-transparent pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {phase === "recall" ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <button className="btn-line flex-col !gap-0 !text-keep" onClick={() => choose(Rating.Good)}>认识<span className="text-[10px] text-subtle">→</span></button>
              <button className="btn-line flex-col !gap-0 !text-hard" onClick={() => choose(Rating.Hard)}>模糊<span className="text-[10px] text-subtle">想不全</span></button>
              <button className="btn-line flex-col !gap-0 !text-again" onClick={() => choose(Rating.Again)}>忘记<span className="text-[10px] text-subtle">←</span></button>
            </div>
            <div className="mt-2 flex justify-between px-1 text-xs text-subtle">
              <button className="press inline-flex h-9 items-center gap-1" onClick={() => setHint(true)} disabled={hint}><Lightbulb className="size-3.5" />{hint ? "已显示提示" : "提示"}</button>
              <button className="press h-9" onClick={() => { s.markKnown(deck.id, w.id); haptic("medium"); advance(1); }}>太简单，不再出现</button>
            </div>
          </>
        ) : choice === Rating.Good ? (
          <div className="grid grid-cols-3 gap-2">
            <button className="btn-line flex-col !gap-0 !text-again" onClick={() => confirm(Rating.Again, -1)}>记错了<span className="text-[10px] text-subtle">稍后再现</span></button>
            <button className="btn-line flex-col !gap-0" onClick={() => confirm(Rating.Easy)}>很简单<span className="text-[10px] text-subtle">{intervals?.[Rating.Easy]}</span></button>
            <button className="btn-ink flex-col !gap-0" onClick={() => confirm(Rating.Good)}>下一个<span className="text-[10px] opacity-70">{intervals?.[Rating.Good]}后</span></button>
          </div>
        ) : (
          <button className="btn-ink w-full flex-col !gap-0" onClick={() => confirm(choice!)}>
            下一个<span className="text-[10px] opacity-70">{choice === Rating.Again ? "这组稍后再看一次" : `${intervals?.[choice!]}后复习`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
