import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useWords } from "../lib/useWords";
import { useStore } from "../store";
import { speak } from "../lib/speech";
import { forDeck } from "../lib/decks";
import type { Word } from "../lib/words";
import { Loading } from "../components/Loading";
import { SpeakButton } from "../components/Pronounce";
import { haptic } from "../lib/haptics";
import { hint } from "../lib/hint";

const SIZE = 15;

/** What the learner types: English spelling, or the kana reading for Japanese. */
export function answerOf(w: Word, lang: "en" | "ja") {
  return lang === "ja" ? w.reading || w.word : w.word;
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
      <div className="card mt-16 p-8 text-center">
        <p className="text-muted">先在「{deck.label}」学习一些单词，再来练习吧。</p>
        <Link href="/" className="btn-ink mt-5 w-full">返回</Link>
      </div>
    );
  if (!w)
    return (
      <div className="card mt-10 space-y-4 p-8 text-center">
        <span className="hanko mx-auto size-16 animate-[stamp_.6s_var(--ease-out-soft)_both] text-3xl">書</span>
        <h1 className="font-jp text-2xl">{lang === "ja" ? "读音练习完成" : "拼写完成"}</h1>
        <p className="text-muted">答对 {score} / {list.length}</p>
        <Link href="/" className="btn-ink w-full">返回</Link>
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
    haptic(ok ? "success" : "error");
    speak(ans, lang);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 py-2">
        <Link href="/" aria-label="退出练习" className="press grid size-10 place-items-center rounded-full text-muted">✕</Link>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(pos / list.length) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-muted">{pos + 1}/{list.length}</span>
      </header>
      <form onSubmit={submit} className="card space-y-5 p-6">
        <p className="eyebrow">{lang === "ja" ? "根据单词和释义，用假名写出读音" : "根据释义拼写单词"}</p>
        {lang === "ja" && ans !== w.word && <p lang="ja" className="font-jp text-4xl">{w.word}</p>}
        <p className="text-lg leading-relaxed">{w.meaning}</p>
        <div className="flex items-center gap-2">
          <p lang={lang} className="flex-1 font-word text-2xl tracking-[0.3em] text-subtle" aria-label="提示">{hint(ans, level)}</p>
          {lang === "en" && <SpeakButton text={ans} lang={lang} />}
        </div>
        <label className="block">
          <span className="sr-only">{lang === "ja" ? "输入假名读音" : "输入单词拼写"}</span>
          <input ref={inputRef} lang={lang} value={input} onChange={(e) => setInput(e.target.value)} readOnly={result !== null}
            autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
            className={`w-full rounded-2xl border-2 bg-surface px-4 py-3 text-xl outline-none ${lang === "en" ? "font-word" : "font-jp"} ${result === null ? "border-border focus:border-accent" : result ? "border-keep" : "border-again"}`} />
        </label>
        <div aria-live="polite">
          {result === true && <p className="text-keep">✓ 正确</p>}
          {result === false && <p className="text-again">✗ 正确答案：<b lang={lang}>{ans}</b></p>}
        </div>
        <div className="flex gap-3">
          {result === null && level === 0 && <button type="button" className="btn-line flex-1" onClick={() => setLevel(1)}>提示</button>}
          <button className="btn-ink flex-1" disabled={result === null && !input.trim()}>{result === null ? "检查" : "下一个"}</button>
        </div>
      </form>
    </div>
  );
}
