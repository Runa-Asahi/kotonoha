import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Volume2, X } from "lucide-react";
import { GOJUON, KANA_GRID, ROW_LABELS, VOICED_GRID, YOON, kanaByHira, type Voiced } from "../data/kana";
import { speakKana } from "../lib/speech";
import { haptic } from "../lib/haptics";
import { useStore } from "../store";
import { ALL_KANA, makeQuiz, SEION, storyPool, type KanaItem, type Mode, type Q } from "../lib/kanaQuiz";
import { Sheet } from "../components/Sheet";

type Script = "hira" | "kata";
const VOICED_BY = new Map<string, Voiced>(VOICED_GRID.flat().map((v) => [v.hira, v]));

function Cell({ k, script, on, onPick, acc, tall }: { k: KanaItem; script: Script; on: boolean; onPick: (k: KanaItem) => void; acc?: [number, number]; tall?: boolean }) {
  const weak = acc && acc[0] + acc[1] >= 2 && acc[1] / (acc[0] + acc[1]) > 0.34;
  return (
    <button type="button" onClick={() => onPick(k)} aria-label={`${k[script]} ${k.romaji}`}
      className={`press relative flex flex-col items-center justify-center rounded-xl ${tall ? "h-16" : "h-[58px]"} ${on ? "bg-ink text-ink-fg" : "bg-surface"} border ${weak ? "border-again/60" : "border-transparent"}`}>
      <span lang="ja" className="font-jp text-[26px] leading-none">{k[script]}</span>
      <span className={`mt-1 font-word text-[11px] italic ${on ? "opacity-70" : "text-subtle"}`}>{k.romaji}</span>
    </button>
  );
}

function Detail({ k, script, onClose }: { k: KanaItem | null; script: Script; onClose: () => void }) {
  const base = k ? kanaByHira(k.hira) ?? (VOICED_BY.get(k.hira) ? kanaByHira(VOICED_BY.get(k.hira)!.base) : undefined) : undefined;
  const voiced = k ? VOICED_BY.get(k.hira) : undefined;
  const yoon = k && k.hira.length === 2;
  return (
    <Sheet open={!!k} onClose={onClose} title="纸灯町 · 分镜">
      {k && (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-subtle">{script === "hira" ? "平假名" : "片假名"} · <span className="font-word italic">{k.romaji}</span></p>
              <p lang="ja" className="mt-1 font-jp text-7xl leading-none">{k[script]}</p>
            </div>
            <button onClick={() => speakKana(k.hira)} aria-label="朗读" className="press grid size-14 place-items-center rounded-full bg-ink text-ink-fg"><Volume2 className="size-6" /></button>
          </div>
          <p className="mt-4 text-sm text-muted"><span lang="ja" className="font-jp">{k.hira} / {k.kata}</span>
            {base && !voiced && !yoon ? ` · 口型：${base.mouth}` : voiced ? ` · 从「${voiced.base}」变来` : ""}</p>
          {voiced && <p className="mt-4 text-sm leading-relaxed">{voiced.kind === "dakuten" ? "同一格分镜。灯花溅出两点，清音沉下去，变成浊音。" : "同一格分镜。灯罩上凝着一小圈，声音变成半浊音。"}</p>}
          {voiced?.note && <p className="mt-2 text-sm text-muted">{voiced.note}</p>}
          {yoon && <p className="mt-4 text-sm leading-relaxed">小ゃ、ゅ、ょ挂在い段旁边，不单独占一拍，只把前面的音拧过去：<span lang="ja" className="font-jp">{k.hira[0]}</span> + <span lang="ja" className="font-jp">{k.hira[1]}</span> → {k.romaji}</p>}
          {base && !yoon && (
            <div className="mt-5 rounded-2xl border border-border bg-elevated/50 p-4">
              <p className="eyebrow">分镜 · 「{base.hira}」</p>
              <p className="mt-2 font-jp leading-relaxed">{base.shot}</p>
            </div>
          )}
          <button onClick={onClose} className="btn-ink mt-5 w-full">关闭</button>
        </div>
      )}
    </Sheet>
  );
}

function Quiz({ mode, pool, script, onExit }: { mode: Mode; pool: "seion" | "all"; script: Script; onExit: () => void }) {
  const stats = useStore((s) => s.kana);
  const record = useStore((s) => s.kanaResult);
  const best = useStore((s) => s.kanaBest);
  const setBest = useStore((s) => s.setKanaBest);
  const size = mode === "story" ? 8 : 15;
  const build = () => {
    const weight = (k: KanaItem) => { const [a, b] = stats[k.hira] ?? [0, 0]; return 1 + b * 2 - Math.min(a, 3) * 0.2; };
    return makeQuiz(mode === "story" ? storyPool() : pool === "seion" ? SEION : ALL_KANA, size, Math.random, weight);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [qs, setQs] = useState<Q[]>(useMemo(build, []));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const q = qs[i];
  const right = picked != null && picked === q?.item.hira;

  // first question of a listening round plays from the tap that opened it (user gesture)
  useEffect(() => { if (mode === "listen" && q && picked == null) speakKana(q.item.hira); }, [mode, q, picked]);
  useEffect(() => { if (!q) setBest(mode === "story" ? score : 0); }, [q, score, mode, setBest]);

  const next = () => { setPicked(null); setI((x) => x + 1); };
  // v1.0.0 touch: a correct answer moves on by itself after a beat
  useEffect(() => {
    if (!right) return;
    const t = setTimeout(next, 750);
    return () => clearTimeout(t);
  }, [right]);

  if (!q)
    return (
      <div className="card mt-5 p-6 text-center">
        <p className="eyebrow">这组成绩</p>
        <p className="mt-2 font-word text-6xl tabular-nums">{score}<span className="text-2xl text-subtle"> / {qs.length}</span></p>
        {mode === "story" && <p className="mt-2 text-sm text-muted">最好成绩 {Math.max(best, score)} / 8。看分镜时，先想字形，再对读音。</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={onExit} className="btn-line">返回表</button>
          <button onClick={() => { setQs(build()); setI(0); setScore(0); setPicked(null); }} className="btn-ink">再测一次</button>
        </div>
      </div>
    );

  const choose = (k: KanaItem) => {
    if (picked) return;
    const ok = k.hira === q.item.hira;
    setPicked(k.hira);
    record(q.item.hira, ok);
    haptic(ok ? "success" : "error");
    if (ok) setScore((s) => s + 1);
    if (mode !== "listen") speakKana(q.item.hira);
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="tabular-nums">{i + 1} / {qs.length}</span>
        <button onClick={onExit} className="press inline-flex h-10 items-center gap-1 px-2"><X className="size-4" />退出</button>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-elevated"><div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${(i / qs.length) * 100}%` }} /></div>
      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mt-4 grid min-h-44 place-items-center p-5 text-center">
        {mode === "story" ? (
          <div><p className="eyebrow">看分镜，选出假名</p><p className="mt-3 font-jp leading-relaxed">{(q.item as { shot?: string }).shot}</p></div>
        ) : mode === "read" ? (
          <div><p className="eyebrow">这个假名怎么读</p><p lang="ja" className="mt-2 font-jp text-8xl leading-none">{q.item[script]}</p></div>
        ) : (
          <div>
            <p className="eyebrow">听音，选出假名</p>
            <button onClick={() => speakKana(q.item.hira)} aria-label="再听一次" className="press mx-auto mt-4 grid size-20 place-items-center rounded-full bg-ink text-ink-fg"><Volume2 className="size-8" /></button>
            <p className="mt-2 text-xs text-subtle">点一下再听</p>
          </div>
        )}
      </motion.div>
      <div className="mt-3 grid grid-cols-2 gap-2" aria-live="polite">
        {q.choices.map((c) => {
          const isAns = picked && c.hira === q.item.hira;
          const wrong = picked === c.hira && !isAns;
          return (
            <button key={c.hira} disabled={!!picked} onClick={() => choose(c)}
              className={`press flex h-16 items-center justify-center rounded-2xl border text-2xl ${isAns ? "border-transparent bg-keep text-white" : wrong ? "border-again text-again" : "border-border bg-surface"} ${mode === "read" ? "font-word" : "font-jp"}`}>
              {mode === "read" ? c.romaji : c[script]}
            </button>
          );
        })}
      </div>
      {picked && !right && (
        <button onClick={next} className="btn-ink mt-3 w-full">下一题 · 是「<span lang="ja" className="font-jp">{q.item[script]}</span>」{q.item.romaji}</button>
      )}
    </div>
  );
}

export default function Kana() {
  const [script, setScript] = useState<Script>("hira");
  const [sel, setSel] = useState<KanaItem | null>(null);
  const [quiz, setQuiz] = useState<{ mode: Mode; pool: "seion" | "all" } | null>(null);
  const [menu, setMenu] = useState(false);
  const stats = useStore((s) => s.kana);
  const best = useStore((s) => s.kanaBest);
  const pick = (k: KanaItem) => { haptic("light"); setSel(k); speakKana(k.hira); };
  const mastered = GOJUON.filter((k) => { const [a, b] = stats[k.hira] ?? [0, 0]; return a >= 2 && a > b * 2; }).length;

  const start = (mode: Mode, pool: "seion" | "all" = "seion") => {
    setMenu(false);
    setQuiz({ mode, pool });
    // unlock audio inside the tap for listening mode (Android WebView / iOS autoplay policy)
    if (mode === "listen") speakKana("あ").then(() => undefined);
  };

  return (
    <div className="pt-2">
      <p className="eyebrow">五十音</p>
      <h1 className="mt-1 font-jp text-[32px] leading-tight">纸灯町</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">把五十音记成一部短片。每一格是一个分镜：字形、口型、读音绑在一起。点任意一格听发音、看分镜。</p>

      <div role="tablist" aria-label="假名类型" className="relative mt-5 grid grid-cols-2 rounded-2xl border border-border bg-surface p-1">
        {(["hira", "kata"] as const).map((s) => (
          <button key={s} role="tab" aria-selected={script === s} onClick={() => setScript(s)} className="press relative z-10 h-10 rounded-xl text-sm font-medium">
            {script === s && <motion.span layoutId="seg" className="absolute inset-0 -z-10 rounded-xl bg-ink" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className={script === s ? "text-ink-fg" : "text-muted"}>{s === "hira" ? "平假名 あ" : "片假名 ア"}</span>
          </button>
        ))}
      </div>

      {quiz ? (
        <Quiz key={`${quiz.mode}-${quiz.pool}-${script}`} mode={quiz.mode} pool={quiz.pool} script={script} onExit={() => setQuiz(null)} />
      ) : (
        <>
          <button onClick={() => setMenu(true)} className="card press mt-3 flex w-full items-center justify-between p-4 text-left">
            <span><span className="block font-medium">假名小测</span><span className="text-xs text-subtle">分镜小测 · 看字选音 · 听音选字{best ? ` · 分镜最好 ${best}/8` : ""}</span></span>
            <span className="text-right"><span className="block font-word text-2xl tabular-nums">{mastered}<span className="text-sm text-subtle">/46</span></span><span className="text-[10px] text-subtle">清音已掌握</span></span>
          </button>

          <section className="mt-6" aria-labelledby="h-seion">
            <h2 id="h-seion" className="text-sm text-muted">清音</h2>
            <div className="mt-3 flex flex-col gap-1.5">
              {KANA_GRID.map((row, r) => (
                <div key={ROW_LABELS[r]} className="flex items-center gap-1.5">
                  <span lang="ja" className="w-5 shrink-0 text-center font-jp text-xs text-subtle">{ROW_LABELS[r]}</span>
                  <div className="grid flex-1 grid-cols-5 gap-1.5">
                    {row.map((k, c) => k ? <Cell key={k.hira} k={k} script={script} on={sel?.hira === k.hira} onPick={pick} acc={stats[k.hira]} /> : <span key={c} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-8" aria-labelledby="h-voiced">
            <h2 id="h-voiced" className="text-sm text-muted">浊音与半浊音</h2>
            <p className="mt-1 text-xs leading-relaxed text-subtle">两点是灯花，小圈是水珠。故事仍用原来那一格，只是声音变了。</p>
            <div className="mt-3 grid grid-cols-5 gap-1.5 pl-6">
              {VOICED_GRID.flat().map((k) => <Cell key={k.hira} k={k} script={script} on={sel?.hira === k.hira} onPick={pick} acc={stats[k.hira]} />)}
            </div>
          </section>
          <section className="mt-8" aria-labelledby="h-yoon">
            <h2 id="h-yoon" className="text-sm text-muted">拗音</h2>
            <p className="mt-1 text-xs leading-relaxed text-subtle">小ゃ、ゅ、ょ挂在い段旁边，不单独占一拍，只把前面的音拧过去。</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {YOON.flat().map((k) => <Cell key={k.hira} k={k} script={script} on={sel?.hira === k.hira} onPick={pick} acc={stats[k.hira]} tall />)}
            </div>
          </section>
          <p className="mt-6 text-center text-[11px] text-subtle">红框 = 小测里常错的假名 · 发音为内置录音，离线可用</p>
        </>
      )}

      <Detail k={sel} script={script} onClose={() => setSel(null)} />
      <Sheet open={menu} onClose={() => setMenu(false)} title="假名小测">
        <div className="space-y-2 pb-2">
          {[
            { m: "story" as Mode, t: "分镜小测", d: "读一段纸灯町分镜，选出对应的假名 · 8 题" },
            { m: "read" as Mode, t: "看字选音 · 清音", d: "看假名，选罗马音 · 15 题" },
            { m: "read" as Mode, t: "看字选音 · 全部", d: "含浊音、拗音", p: "all" as const },
            { m: "listen" as Mode, t: "听音选字 · 清音", d: "听内置录音，选假名 · 15 题" },
            { m: "listen" as Mode, t: "听音选字 · 全部", d: "含浊音、拗音", p: "all" as const },
          ].map((o) => (
            <button key={o.t} onClick={() => start(o.m, o.p)} className="press flex w-full flex-col rounded-2xl border border-border p-4 text-left">
              <span className="font-medium">{o.t}</span><span className="text-xs text-subtle">{o.d}</span>
            </button>
          ))}
          <p className="pt-1 text-center text-[11px] text-subtle">常错的假名会更常出现 · 使用当前选择的{script === "hira" ? "平假名" : "片假名"}</p>
        </div>
      </Sheet>
    </div>
  );
}
