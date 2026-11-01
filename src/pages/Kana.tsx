import { useState } from "react";
import { Link } from "wouter";
import { KANA_GRID, VOICED_GRID, YOON, kanaByHira, ROW_LABELS } from "../data/kana";
import { speak } from "../lib/speech";
import { useStore } from "../store";
import { ALL_KANA, makeQuiz, SEION, type KanaItem, type Q } from "../lib/kanaQuiz";

type Script = "hira" | "kata";

function Cell({ k, script, onPick, acc }: { k: KanaItem | null; script: Script; onPick: (k: KanaItem) => void; acc?: [number, number] }) {
  if (!k) return <div aria-hidden />;
  const tint = acc && acc[0] + acc[1] >= 2 ? (acc[1] / (acc[0] + acc[1]) > 0.34 ? "ring-rose-300" : "ring-emerald-300") : "ring-slate-200 dark:ring-slate-800";
  return (
    <button onClick={() => onPick(k)} aria-label={`${k[script]} ${k.romaji}`}
      className={`flex aspect-square flex-col items-center justify-center rounded-xl bg-white ring-1 hover:ring-brand-500 dark:bg-slate-900 ${tint}`}>
      <span lang="ja" className="text-2xl leading-none">{k[script]}</span>
      <span className="mt-1 text-[11px] text-slate-500">{k.romaji}</span>
    </button>
  );
}

function Drill({ script, onExit }: { script: Script; onExit: () => void }) {
  const stats = useStore((s) => s.kana);
  const record = useStore((s) => s.kanaResult);
  const [setup, setSetup] = useState<{ pool: "seion" | "all"; mode: "read" | "listen" } | null>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const start = (pool: "seion" | "all", mode: "read" | "listen") => {
    const weight = (k: KanaItem) => { const [a, b] = stats[k.hira] ?? [0, 0]; return 1 + b * 2 - Math.min(a, 3) * 0.2; };
    const q = makeQuiz(pool === "seion" ? SEION : ALL_KANA, 20, script, mode, Math.random, weight);
    setSetup({ pool, mode }); setQs(q); setI(0); setScore(0); setPicked(null);
    if (mode === "listen") speak(q[0].item.hira, "ja");
  };

  if (!setup)
    return (
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">{script === "hira" ? "平假名" : "片假名"}小测 · 20 题</h2>
        <p className="text-sm text-slate-500">答错的假名下次会更常出现。</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary" onClick={() => start("seion", "read")}>看假名选读音<span className="text-xs opacity-80">清音</span></button>
          <button className="btn-primary" onClick={() => start("all", "read")}>看假名选读音<span className="text-xs opacity-80">全部</span></button>
          <button className="btn-ghost" onClick={() => start("seion", "listen")}>听音选假名<span className="text-xs opacity-70">清音</span></button>
          <button className="btn-ghost" onClick={() => start("all", "listen")}>听音选假名<span className="text-xs opacity-70">全部</span></button>
        </div>
        <button className="w-full text-sm text-slate-500" onClick={onExit}>返回五十音图</button>
      </div>
    );

  const q = qs[i];
  if (!q)
    return (
      <div className="card space-y-4 p-8 text-center">
        <p className="text-5xl">{score >= 18 ? "🎉" : "💪"}</p>
        <p className="text-xl font-bold">答对 {score} / {qs.length}</p>
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={() => setSetup(null)}>换个模式</button>
          <button className="btn-primary flex-1" onClick={() => start(setup.pool, setup.mode)}>再来一组</button>
        </div>
      </div>
    );

  const choose = (c: string) => {
    if (picked) return;
    const ok = c === q.answer;
    setPicked(c);
    record(q.item.hira, ok);
    if (ok) setScore((s) => s + 1);
    if (setup.mode === "read") speak(q.item.hira, "ja");
  };
  const next = () => {
    setPicked(null);
    setI((x) => x + 1);
    if (setup.mode === "listen" && qs[i + 1]) speak(qs[i + 1].item.hira, "ja");
  };

  return (
    <div className="card space-y-5 p-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <button onClick={() => setSetup(null)} aria-label="退出小测">✕</button>
        <span>{i + 1} / {qs.length}</span>
      </div>
      <div className="py-4 text-center">
        {setup.mode === "read" ? (
          <p lang="ja" className="text-7xl">{q.item[script]}</p>
        ) : (
          <button className="btn-ghost mx-auto h-20 w-20 rounded-full text-3xl" onClick={() => speak(q.item.hira, "ja")} aria-label="再听一次">🔊</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3" aria-live="polite">
        {q.choices.map((c) => {
          const st = picked ? (c === q.answer ? "bg-emerald-500 text-white" : c === picked ? "bg-rose-500 text-white" : "btn-ghost") : "btn-ghost";
          return <button key={c} lang={setup.mode === "listen" ? "ja" : undefined} className={`btn text-xl ${st}`} onClick={() => choose(c)}>{c}</button>;
        })}
      </div>
      {picked && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-slate-500"><span lang="ja">{q.item.hira} / {q.item.kata}</span> · {q.item.romaji}</p>
          <button className="btn-primary w-full" onClick={next} autoFocus>下一题</button>
        </div>
      )}
    </div>
  );
}

export default function Kana() {
  const [script, setScript] = useState<Script>("hira");
  const [sel, setSel] = useState<KanaItem | null>(null);
  const [drill, setDrill] = useState(false);
  const stats = useStore((s) => s.kana);
  const pick = (k: KanaItem) => { setSel(k); speak(k.hira, "ja"); };
  const detail = sel ? kanaByHira(sel.hira) : undefined;
  const voicedNote = sel ? VOICED_GRID.flat().find((v) => v.hira === sel.hira) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <Link href="/" className="text-sm text-brand-600">← 今日</Link>
        <h1 className="ml-2 text-2xl font-bold">五十音</h1>
      </div>
      <div role="tablist" className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(["hira", "kata"] as const).map((s) => (
          <button key={s} role="tab" aria-selected={script === s} onClick={() => setScript(s)}
            className={`rounded-lg py-2 text-sm font-medium ${script === s ? "bg-white shadow dark:bg-slate-900" : "text-slate-500"}`}>{s === "hira" ? "平假名 あ" : "片假名 ア"}</button>
        ))}
      </div>

      {drill ? <Drill script={script} onExit={() => setDrill(false)} /> : (
        <>
          <button className="btn-primary w-full" onClick={() => setDrill(true)}>开始假名小测</button>
          {sel && (
            <section aria-live="polite" className="card flex items-start gap-4 p-4">
              <div className="text-center"><p lang="ja" className="text-5xl">{sel[script]}</p><p className="text-sm text-slate-500">{sel.hira} · {sel.kata} · {sel.romaji}</p></div>
              <div className="flex-1 space-y-1 text-sm">
                {detail && <><p><b>口型：</b>{detail.mouth}</p><p className="text-slate-600 dark:text-slate-300">{detail.shot}</p></>}
                {voicedNote?.note && <p className="text-slate-600 dark:text-slate-300">{voicedNote.note}</p>}
                {!detail && !voicedNote?.note && <p className="text-slate-500">点击 🔊 再听一次</p>}
                <button className="text-brand-600" onClick={() => speak(sel.hira, "ja")}>🔊 再听一次</button>
              </div>
            </section>
          )}
          <section aria-labelledby="seion-h">
            <h2 id="seion-h" className="mb-2 text-sm font-medium text-slate-500">清音</h2>
            <div className="space-y-2">
              {KANA_GRID.map((row, r) => (
                <div key={ROW_LABELS[r]} className="grid grid-cols-5 gap-2">
                  {row.map((k, c) => <Cell key={c} k={k} script={script} onPick={pick} acc={k ? stats[k.hira] : undefined} />)}
                </div>
              ))}
            </div>
          </section>
          <section aria-labelledby="voiced-h">
            <h2 id="voiced-h" className="mb-2 text-sm font-medium text-slate-500">浊音 · 半浊音</h2>
            <div className="space-y-2">
              {VOICED_GRID.map((row, r) => (
                <div key={r} className="grid grid-cols-5 gap-2">{row.map((k) => <Cell key={k.hira} k={k} script={script} onPick={pick} acc={stats[k.hira]} />)}</div>
              ))}
            </div>
          </section>
          <section aria-labelledby="yoon-h">
            <h2 id="yoon-h" className="mb-2 text-sm font-medium text-slate-500">拗音</h2>
            <div className="grid grid-cols-6 gap-2">
              {YOON.flat().map((k) => <Cell key={k.hira} k={k} script={script} onPick={pick} acc={stats[k.hira]} />)}
            </div>
          </section>
          <p className="text-center text-xs text-slate-400">绿色框 = 小测掌握较好，红色框 = 常错</p>
        </>
      )}
    </div>
  );
}
