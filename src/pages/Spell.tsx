import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useWords } from "../lib/useWords";
import { useStore } from "../store";
import { speak } from "../lib/speech";
import { forDeck } from "../lib/decks";
import { kanaReading, type Word } from "../lib/words";
import { Loading } from "../components/Loading";
import { SpeakButton } from "../components/SpeakButton";
import { hint } from "../lib/hint";

const SIZE = 15;

/** What the learner types: English spelling, or the kana reading for Japanese. */
export function answerOf(w: Word, lang: "en" | "ja") {
  return lang === "ja" ? kanaReading(w) || w.word : w.word;
}

export default function Spell() {
  const { words, error, retry, deck } = useWords();
  const autoSpeak = useStore((s) => s.settings.autoSpeak);
  const lang = deck.lang;
  const [list] = useState(() =>
    Object.entries(forDeck(useStore.getState().cards, deck.id))
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
  const ans = w ? answerOf(w, lang) : "";

  useEffect(() => {
    inputRef.current?.focus();
    if (w && autoSpeak && lang === "en") speak(w.word, lang);
  }, [w, autoSpeak, lang]);

  if (!words) return <Loading error={error} retry={retry} />;
  if (!list.length)
    return (
      <div className="card mt-10 p-8 text-center">
        <p>先在「{deck.label}」学习一些单词，再来练习吧。</p>
        <Link href="/" className="btn-primary mt-4">返回</Link>
      </div>
    );
  if (!w)
    return (
      <div className="card mt-10 space-y-4 p-8 text-center">
        <p className="text-5xl">✍️</p>
        <h1 className="text-xl font-bold">{lang === "ja" ? "读音练习完成" : "拼写完成"}</h1>
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
    const ok = input.trim().toLowerCase() === ans.toLowerCase();
    setResult(ok);
    if (ok) setScore((s) => s + 1);
    speak(ans, lang);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 py-2">
        <Link href="/" aria-label="退出练习" className="rounded-full p-2 text-slate-500">✕</Link>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-brand-500" style={{ width: `${(pos / list.length) * 100}%` }} />
        </div>
        <span className="text-sm text-slate-500">{pos + 1}/{list.length}</span>
      </header>
      <form onSubmit={submit} className="card space-y-5 p-6">
        <p className="text-xs text-slate-400">{lang === "ja" ? "根据单词和释义，用假名写出读音" : "根据释义拼写单词"}</p>
        {lang === "ja" && ans !== w.word && <p lang="ja" className="text-3xl font-bold">{w.word}</p>}
        <p className="text-lg leading-relaxed">{w.meaning}</p>
        <div className="flex items-center gap-2">
          <p lang={lang} className="flex-1 font-mono text-xl tracking-widest text-slate-400" aria-label="提示">{hint(ans, level)}</p>
          {lang === "en" && <SpeakButton text={ans} lang={lang} />}
        </div>
        <label className="block">
          <span className="sr-only">{lang === "ja" ? "输入假名读音" : "输入单词拼写"}</span>
          <input ref={inputRef} lang={lang} value={input} onChange={(e) => setInput(e.target.value)} readOnly={result !== null}
            autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
            className={`w-full rounded-xl border-2 bg-transparent px-4 py-3 text-xl outline-none ${result === null ? "border-slate-200 focus:border-brand-500 dark:border-slate-700" : result ? "border-emerald-500" : "border-rose-500"}`} />
        </label>
        <div aria-live="polite">
          {result === true && <p className="text-emerald-600">✓ 正确</p>}
          {result === false && <p className="text-rose-600">✗ 正确答案：<b lang={lang}>{ans}</b></p>}
        </div>
        <div className="flex gap-3">
          {result === null && level === 0 && <button type="button" className="btn-ghost flex-1" onClick={() => setLevel(1)}>提示</button>}
          <button className="btn-primary flex-1" disabled={result === null && !input.trim()}>{result === null ? "检查" : "下一个"}</button>
        </div>
      </form>
    </div>
  );
}
