import { ChevronLeft, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Word } from "@/data/types";
import { deckOf } from "@/data/types";
import { wordById } from "@/data/words";
import { cn } from "@/lib/cn";
import { formatMinutes, nextStep, ratingsFor, RATING_LABEL, STAGE_LABEL, type Rating } from "@/lib/srs";
import { speak } from "@/lib/speak";
import { buildQueue, useMemory } from "@/lib/store";

export type StudyPhase = "run" | "done" | "empty";

export function StudyView({ onExit, onPhase }: { onExit: () => void; onPhase: (phase: StudyPhase) => void }) {
  const review = useMemory((state) => state.review);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [face, setFace] = useState<"front" | "hint" | "back">("front");
  const [misses, setMisses] = useState(0);
  const [silent, setSilent] = useState(false);
  const requeued = useRef(new Set<string>());

  useEffect(() => {
    setQueue(buildQueue(useMemory.getState()));
  }, []);

  useEffect(() => {
    if (!queue) return;
    if (cursor >= queue.length) onPhase(queue.length === 0 ? "empty" : "done");
    else onPhase("run");
  }, [queue, cursor, onPhase]);

  const word = queue && cursor < queue.length ? wordById(queue[cursor]) : undefined;

  function play(text: string, lang: "en-US" | "ja-JP") {
    setSilent(!speak(text, lang));
  }

  function rate(current: Word, rating: Rating) {
    review(current.id, rating);
    if (rating === "again") setMisses((count) => count + 1);
    if (rating === "again" && queue && !requeued.current.has(current.id)) {
      requeued.current.add(current.id);
      setQueue([...queue, current.id]);
    }
    setFace("front");
    setCursor((index) => index + 1);
  }

  if (!queue) {
    return <p className="px-5 pt-8 text-sm text-muted">正在排列今天的词。</p>;
  }

  if (!word) {
    const finished = queue.length > 0;
    return (
      <div className="px-5 pt-8">
        <p className="text-xs tracking-widest text-subtle">ことのは</p>
        <h2 className="mt-2 font-display text-4xl leading-tight">{finished ? "这组完成了" : "现在没有要学的词"}</h2>
        <p className="mt-3 text-sm text-muted">
          {finished
            ? `过了 ${queue.length} 张，其中忘记 ${misses} 次。忘了的词如果还在这组里，会排到后面再看一次。`
            : "今天的新词额度用完了，或者这些课都还没到复习时间。回到今日可以再加一组，或换一门课。"}
        </p>
        <button
          type="button"
          onClick={onExit}
          className="press mt-8 flex h-12 w-full items-center justify-center rounded-md bg-accent font-medium text-accent-fg"
        >
          回到今日
        </button>
      </div>
    );
  }

  const deck = deckOf(word.deck);
  const card = useMemory.getState().cards[word.id];
  const stage = card?.stage ?? 0;
  const ratings = ratingsFor(stage);
  const japanese = deck.lang === "ja";
  const long = word.word.length > 11;

  return (
    <div className="px-5 pt-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onExit} className="press inline-flex h-11 items-center gap-1 text-sm text-muted">
          <ChevronLeft className="size-4" />
          今日
        </button>
        <p className="text-sm tabular-nums text-muted">
          {cursor + 1} / {queue.length}
        </p>
      </div>
      <div className="mt-3 h-1 rounded-sm bg-elevated">
        <div
          className="h-1 rounded-sm bg-accent"
          style={{ width: `${(cursor / queue.length) * 100}%` }}
        />
      </div>

      <article className="mt-5 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-subtle">
              {deck.level} · {card ? STAGE_LABEL[stage] : "新词"}
            </p>
            <h2
              lang={japanese ? "ja" : "en"}
              className={cn(
                "mt-2 break-words leading-none",
                japanese ? "font-jp" : "font-display",
                long ? "text-3xl" : "text-5xl",
              )}
            >
              {word.word}
            </h2>
            <p className="mt-3 text-sm text-muted">
              {japanese ? `${word.reading}${word.roma ? ` · ${word.roma}` : ""}` : word.ipa}
            </p>
          </div>
          <button
            type="button"
            aria-label="朗读"
            onClick={() => play(word.word, japanese ? "ja-JP" : "en-US")}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-elevated"
          >
            <Volume2 className="size-5" />
          </button>
        </div>
        {silent ? <p className="mt-3 text-xs text-subtle">这台设备暂时没有语音，可以先看音标和假名。</p> : null}

        {face !== "front" ? (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs text-subtle">{japanese ? "汉字" : "词根"}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {word.parts.map((part) => (
                <li key={`${part.t}-${part.g}`} className="rounded-sm border border-border bg-elevated px-2 py-1">
                  <span className={cn("text-base", japanese ? "font-jp" : "font-display")}>{part.t}</span>
                  <span className="ml-2 text-xs text-muted">{part.g}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted">{word.hook}</p>
          </div>
        ) : null}

        {face === "back" ? (
          <div className="mt-4">
            <p className="text-2xl leading-snug">{word.meaning}</p>
            <p className="mt-1 text-xs text-subtle">{word.pos}</p>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <p lang={japanese ? "ja" : "en"} className="text-sm leading-relaxed">
                  {word.example}
                </p>
                <p className="mt-1 text-sm text-muted">{word.exampleZh}</p>
              </div>
              <button
                type="button"
                aria-label="朗读例句"
                onClick={() => play(word.example, japanese ? "ja-JP" : "en-US")}
                className="press grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border"
              >
                <Volume2 className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </article>

      {face === "back" ? (
        <div className={cn("mt-4 grid gap-2", ratings.length === 3 ? "grid-cols-3" : "grid-cols-4")}>
          {ratings.map((rating) => {
            const primary = rating === "good";
            const gap = formatMinutes(nextStep(stage, rating).minutes);
            return (
              <button
                key={rating}
                type="button"
                onClick={() => rate(word, rating)}
                className={cn(
                  "press min-h-14 rounded-md border px-1 py-2",
                  primary ? "border-transparent bg-accent text-accent-fg" : "border-border bg-surface text-fg",
                )}
              >
                <span className={cn("block text-sm font-medium", rating === "again" && !primary ? "text-again" : "")}>
                  {RATING_LABEL[rating]}
                </span>
                <span className={cn("mt-0.5 block text-xs", primary ? "text-accent-fg/70" : "text-subtle")}>{gap}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFace("hint")}
            disabled={face === "hint"}
            className="press h-12 rounded-md border border-border bg-surface text-sm font-medium disabled:opacity-40"
          >
            {japanese ? "汉字提示" : "词根提示"}
          </button>
          <button
            type="button"
            onClick={() => setFace("back")}
            className="press h-12 rounded-md bg-accent text-sm font-medium text-accent-fg"
          >
            查看释义
          </button>
        </div>
      )}
    </div>
  );
}
