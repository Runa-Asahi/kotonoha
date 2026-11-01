import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useWords } from "../lib/useWords";
import { useStore } from "../store";
import { speak } from "../lib/speech";
import { Loading } from "../components/Loading";
import { SpeakButton } from "../components/SpeakButton";
import { hint } from "../lib/hint";

const SIZE = 15;

export default function Spell() {
  const { words, error, retry } = useWords();
  const cards = useStore((s) => s.cards);
  const autoSpeak = useStore((s) => s.settings.autoSpeak);
  const [list] = useState(() =>
    // most recently reviewed / weakest words first
    Object.entries(useStore.getState().cards)
      .sort(([, a], [, b]) => a.stability - b.stability)
      .slice(0, SIZE)
      .map(([id]) => Number(id)),
  );
  const [pos, setPos] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const w = useMemo(() => (words ? words[list[pos]] : undefined), [words, list, pos]);

  useEffect(() => {
    inputRef.current?.focus();
    if (w && autoSpeak) speak(w.word);
  }, [w, autoSpeak]);

  if (!words) return <Loading error={error} retry={retry} />;
  if (!Object.keys(cards).length || !list.length)
    return (
      <div className="card mt-10 p-8 text-center">
        <p>先去学习一些单词，再来练拼写吧。</p>
        <Link href="/" className="btn-primary mt-4">返回</Link>
      </div>
    );
  if (!w)
    return (
      <div className="card mt-10 space-y-4 p-8 text-center">
        <p className="text-5xl">✍️</p>
        <h1 className="text-xl font-bold">拼写完成</h1>
        <p className="text-slate-500">答对 {score} / {list.length}</p>
        <Link href="/" className="btn-primary w-full">返回</Link>
      </div>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (result !== null) {
      setPos((p) => p + 1);
      setInput("");
      setResult(null);
      setLevel(0);
      return;
    }
    const ok = input.trim().toLowerCase() === w.word.toLowerCase();
    setResult(ok);
    if (ok) setScore((s) => s + 1);
    speak(w.word);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 py-2">
        <Link href="/" aria-label="退出拼写" className="rounded-full p-2 text-slate-500">✕</Link>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-brand-500" style={{ width: `${(pos / list.length) * 100}%` }} />
        </div>
        <span className="text-sm text-slate-500">{pos + 1}/{list.length}</span>
      </header>
      <form onSubmit={submit} className="card space-y-5 p-6">
        <p className="text-lg leading-relaxed">{w.meaning}</p>
        <div className="flex items-center gap-2">
          <p className="flex-1 font-mono text-xl tracking-widest text-slate-400" aria-label="提示">{hint(w.word, level)}</p>
          <SpeakButton text={w.word} />
        </div>
        <label className="block">
          <span className="sr-only">输入单词拼写</span>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} readOnly={result !== null}
            autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} inputMode="text"
            className={`w-full rounded-xl border-2 bg-transparent px-4 py-3 text-xl outline-none ${result === null ? "border-slate-200 focus:border-brand-500 dark:border-slate-700" : result ? "border-emerald-500" : "border-rose-500"}`} />
        </label>
        <div aria-live="polite">
          {result === true && <p className="text-emerald-600">✓ 正确</p>}
          {result === false && <p className="text-rose-600">✗ 正确拼写：<b>{w.word}</b></p>}
        </div>
        <div className="flex gap-3">
          {result === null && level === 0 && <button type="button" className="btn-ghost flex-1" onClick={() => setLevel(1)}>提示</button>}
          <button className="btn-primary flex-1" disabled={result === null && !input.trim()}>{result === null ? "检查" : "下一个"}</button>
        </div>
      </form>
    </div>
  );
}
