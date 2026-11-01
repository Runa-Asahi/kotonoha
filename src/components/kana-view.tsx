import { Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GOJUON, KANA_GRID, ROW_LABELS, VOICED_GRID, YOON, kanaByHira, type Kana, type Voiced, type Yoon } from "@/data/kana";
import { cn } from "@/lib/cn";
import { speak } from "@/lib/speak";
import { useMemory } from "@/lib/store";

type Script = "hira" | "kata";
type Picked = { kind: "goju"; kana: Kana } | { kind: "voiced"; item: Voiced };

type QuizItem = { answer: Kana; choices: Kana[] };

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap];
    copy[swap] = current;
  }
  return copy;
}

function makeQuiz(): QuizItem[] {
  return shuffle(GOJUON)
    .slice(0, 8)
    .map((answer) => ({
      answer,
      choices: shuffle([answer, ...shuffle(GOJUON.filter((item) => item.hira !== answer.hira)).slice(0, 3)]),
    }));
}

export function KanaView() {
  const best = useMemory((state) => state.kanaBest);
  const setBest = useMemory((state) => state.setKanaBest);
  const [script, setScript] = useState<Script>("hira");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [quiz, setQuiz] = useState<QuizItem[] | null>(null);

  return (
    <div className="px-5 pt-6">
      <p className="text-xs tracking-widest text-subtle">五十音</p>
      <h1 className="mt-1 font-jp text-3xl leading-tight">纸灯町</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        把五十音记成一部短片。每一格是一个分镜：字形、口型、读音绑在一起。
      </p>

      {quiz ? (
        <Quiz items={quiz} best={best} onScore={setBest} onClose={() => setQuiz(null)} onAgain={() => setQuiz(makeQuiz())} />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(
              [
                ["hira", "平假名"],
                ["kata", "片假名"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={script === id}
                onClick={() => setScript(id)}
                className={cn(
                  "press h-11 rounded-md border text-sm font-medium",
                  script === id ? "border-transparent bg-accent text-accent-fg" : "border-border bg-surface text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setQuiz(makeQuiz());
            }}
            className="press mt-3 flex h-11 w-full items-center justify-center rounded-md border border-border bg-surface text-sm font-medium"
          >
            分镜小测{best > 0 ? ` · 最好 ${best}/8` : ""}
          </button>

          <section className="mt-6">
            <h2 className="text-sm text-muted">清音</h2>
            <div className="mt-3 flex flex-col gap-1.5">
              {KANA_GRID.map((row, rowIndex) => (
                <div key={ROW_LABELS[rowIndex]} className="flex items-center gap-1.5">
                  <span className="w-6 shrink-0 text-center text-xs text-subtle">{ROW_LABELS[rowIndex]}</span>
                  <div className="grid flex-1 grid-cols-5 gap-1.5">
                    {row.map((cell, cellIndex) =>
                      cell ? (
                        <button
                          key={cell.hira}
                          type="button"
                          aria-label={`${cell.hira} ${cell.romaji}`}
                          onClick={() => setPicked({ kind: "goju", kana: cell })}
                          className={cn(
                            "press flex h-12 items-center justify-center rounded-sm font-jp text-2xl",
                            picked?.kind === "goju" && picked.kana.hira === cell.hira
                              ? "bg-accent text-accent-fg"
                              : "bg-surface text-fg",
                          )}
                        >
                          {script === "hira" ? cell.hira : cell.kata}
                        </button>
                      ) : (
                        <span key={`empty-${rowIndex}-${cellIndex}`} className="h-12" />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm text-muted">浊音与半浊音</h2>
            <p className="mt-1 text-xs leading-relaxed text-subtle">两点是灯花，小圈是水珠。故事仍用原来那一格，只是声音变了。</p>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {VOICED_GRID.flat().map((item) => (
                <button
                  key={item.hira}
                  type="button"
                  aria-label={`${item.hira} ${item.romaji}`}
                  onClick={() => setPicked({ kind: "voiced", item })}
                  className={cn(
                    "press flex h-12 items-center justify-center rounded-sm font-jp text-2xl",
                    picked?.kind === "voiced" && picked.item.hira === item.hira
                      ? "bg-accent text-accent-fg"
                      : "bg-surface text-fg",
                  )}
                >
                  {script === "hira" ? item.hira : item.kata}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm text-muted">拗音</h2>
            <p className="mt-1 text-xs leading-relaxed text-subtle">小ゃ、ゅ、ょ挂在い段旁边，不单独占一拍，只把前面的音拧过去。</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {YOON.flat().map((item) => (
                <YoonCell key={item.hira} item={item} script={script} />
              ))}
            </div>
          </section>
        </>
      )}

      {picked ? <Detail picked={picked} script={script} onClose={() => setPicked(null)} /> : null}
    </div>
  );
}

function YoonCell({ item, script }: { item: Yoon; script: Script }) {
  const [said, setSaid] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const ok = speak(item.hira, "ja-JP");
        setSaid(!ok);
      }}
      className="press flex h-14 flex-col items-center justify-center rounded-sm bg-surface"
    >
      <span className="font-jp text-xl leading-none">{script === "hira" ? item.hira : item.kata}</span>
      <span className="mt-1 text-xs text-subtle">{said ? "无语音" : item.romaji}</span>
    </button>
  );
}

function Detail({ picked, script, onClose }: { picked: Picked; script: Script; onClose: () => void }) {
  const kana = picked.kind === "goju" ? picked.kana : kanaByHira(picked.item.base);
  const glyph = picked.kind === "goju" ? picked.kana : picked.item;
  const [silent, setSilent] = useState(false);
  if (!kana) return null;
  const mark =
    picked.kind === "voiced"
      ? picked.item.kind === "dakuten"
        ? "同一格分镜。灯花溅出两点，清音沉下去，变成浊音。"
        : "同一格分镜。灯罩上凝着一小圈，声音变成半浊音。"
      : null;

  return (
    <div className="fixed inset-0 z-40">
      <button type="button" aria-label="关闭分镜" className="absolute inset-0 bg-bg/80" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kana-title"
        className="sheet absolute inset-x-0 bottom-0 mx-auto max-h-[78vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-5"
      >
        <p className="text-xs text-subtle">{script === "hira" ? "平假名" : "片假名"} · {glyph.romaji}</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h2 id="kana-title" className="font-jp text-6xl leading-none">
            {script === "hira" ? glyph.hira : glyph.kata}
          </h2>
          <button
            type="button"
            aria-label="朗读"
            onClick={() => setSilent(!speak(glyph.hira, "ja-JP"))}
            className="press grid h-11 w-11 place-items-center rounded-md border border-border"
          >
            <Volume2 className="size-5" />
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">
          {glyph.hira} / {glyph.kata}
          {picked.kind === "goju" ? ` · 口型：${kana.mouth}` : ` · 从「${kana.hira}」变来`}
        </p>
        {silent ? <p className="mt-2 text-xs text-subtle">这台设备暂时读不出声音。</p> : null}
        {mark ? <p className="mt-4 text-sm leading-relaxed">{mark}</p> : null}
        {picked.kind === "voiced" && picked.item.note ? (
          <p className="mt-2 text-sm text-muted">{picked.item.note}</p>
        ) : null}
        <p className="mt-4 text-xs text-subtle">纸灯町 · 分镜</p>
        <p className="mt-1 text-sm leading-relaxed">{kana.shot}</p>
        <button
          type="button"
          onClick={onClose}
          className="press mt-5 h-11 w-full rounded-md bg-accent font-medium text-accent-fg"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

function Quiz({
  items,
  best,
  onScore,
  onClose,
  onAgain,
}: {
  items: QuizItem[];
  best: number;
  onScore: (score: number) => void;
  onClose: () => void;
  onAgain: () => void;
}) {
  const [cursor, setCursor] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const item = items[cursor];

  useEffect(() => {
    if (finished) onScore(correct);
  }, [finished, correct, onScore]);

  const revealed = choice !== null;
  const right = choice === item?.answer.hira;

  useEffect(() => {
    if (!revealed || !right || finished) return;
    const timer = window.setTimeout(() => {
      setChoice(null);
      setCursor((index) => {
        if (index + 1 >= items.length) {
          setFinished(true);
          return index;
        }
        return index + 1;
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [revealed, right, finished, items.length]);

  const scoreLabel = useMemo(() => `${correct} / ${items.length}`, [correct, items.length]);

  if (finished || !item) {
    return (
      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-muted">这组成绩</p>
        <p className="mt-1 font-display text-5xl leading-none tabular-nums">{scoreLabel}</p>
        <p className="mt-3 text-sm text-muted">最好成绩 {Math.max(best, correct)} / 8。看分镜时，先想字形，再对读音。</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="press h-11 rounded-md border border-border text-sm">
            返回表
          </button>
          <button type="button" onClick={onAgain} className="press h-11 rounded-md bg-accent text-sm font-medium text-accent-fg">
            再测一次
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="tabular-nums">
          {cursor + 1} / {items.length}
        </span>
        <button type="button" onClick={onClose} className="press h-11 px-2 text-sm">
          退出
        </button>
      </div>
      <p className="mt-2 text-xs text-subtle">看分镜，选出假名</p>
      <p className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed">{item.answer.shot}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {item.choices.map((option) => {
          const chosen = choice === option.hira;
          const isAnswer = revealed && option.hira === item.answer.hira;
          return (
            <button
              key={option.hira}
              type="button"
              disabled={revealed}
              onClick={() => {
                setChoice(option.hira);
                if (option.hira === item.answer.hira) setCorrect((count) => count + 1);
              }}
              className={cn(
                "press flex h-16 items-center justify-center rounded-md border font-jp text-3xl",
                isAnswer
                  ? "border-transparent bg-accent text-accent-fg"
                  : chosen
                    ? "border-again text-again"
                    : "border-border bg-surface",
              )}
            >
              {option.hira}
            </button>
          );
        })}
      </div>
      {revealed && !right ? (
        <button
          type="button"
          onClick={() => {
            setChoice(null);
            if (cursor + 1 >= items.length) setFinished(true);
            else setCursor((index) => index + 1);
          }}
          className="press mt-3 h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
        >
          下一题 · 是「{item.answer.hira}」
        </button>
      ) : null}
    </div>
  );
}
