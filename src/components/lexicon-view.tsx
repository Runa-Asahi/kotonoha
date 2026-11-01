import { ChevronLeft, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DECKS, deckOf, type DeckId } from "@/data/types";
import { WORDS } from "@/data/words";
import { cn } from "@/lib/cn";
import { speak } from "@/lib/speak";
import { useMemory } from "@/lib/store";

export function LexiconView({ onBack }: { onBack: () => void }) {
  const selected = useMemory((state) => state.selected);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [silent, setSilent] = useState(false);
  const needle = query.trim().toLowerCase();

  const groups = useMemo(() => {
    return DECKS.filter((deck) => selected.includes(deck.id))
      .map((deck) => ({
        deck,
        words: WORDS.filter((word) => {
          if (word.deck !== deck.id) return false;
          if (!needle) return true;
          return (
            word.word.toLowerCase().includes(needle) ||
            word.meaning.toLowerCase().includes(needle) ||
            word.reading.toLowerCase().includes(needle) ||
            (word.roma ?? "").toLowerCase().includes(needle)
          );
        }),
      }))
      .filter((group) => group.words.length > 0);
  }, [needle, selected]);

  const total = groups.reduce((sum, group) => sum + group.words.length, 0);

  return (
    <div className="px-5 pt-5">
      <button type="button" onClick={onBack} className="press inline-flex h-11 items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" />
        今日
      </button>
      <h1 className="mt-1 font-display text-3xl leading-tight">词库</h1>
      <p className="mt-2 text-sm text-muted">只浏览，不会计入复习。当前课程共 {total} 个。</p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="搜单词、假名或意思"
        className="mt-4 h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-fg outline-none placeholder:text-subtle"
      />
      {silent ? <p className="mt-2 text-xs text-subtle">这台设备暂时没有语音。</p> : null}
      {total === 0 ? <p className="mt-6 text-sm text-muted">没有找到。换个词，或回今日打开别的课程。</p> : null}
      <div className="mt-4">
        {groups.map((group) => (
          <section key={group.deck.id} className="mt-6">
            <h2 className="text-sm text-muted">
              {group.deck.label}
              <span className="ml-2 text-xs text-subtle">{group.deck.level}</span>
            </h2>
            <ul className="mt-2">
              {group.words.map((word) => {
                const expanded = open === word.id;
                const japanese = deckOf(word.deck as DeckId).lang === "ja";
                return (
                  <li key={word.id} className="border-b border-border">
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : word.id)}
                      className="flex w-full items-baseline justify-between gap-3 py-3 text-left"
                    >
                      <span className={cn("text-lg", japanese ? "font-jp" : "font-display")}>{word.word}</span>
                      <span className="shrink-0 text-sm text-muted">{word.meaning}</span>
                    </button>
                    {expanded ? (
                      <div className="pb-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-muted">
                            {japanese ? `${word.reading}${word.roma ? ` · ${word.roma}` : ""}` : word.ipa}
                          </p>
                          <button
                            type="button"
                            aria-label="朗读"
                            onClick={() => setSilent(!speak(word.word, japanese ? "ja-JP" : "en-US"))}
                            className="press grid h-11 w-11 place-items-center rounded-md border border-border"
                          >
                            <Volume2 className="size-4" />
                          </button>
                        </div>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {word.parts.map((part) => (
                            <li key={`${word.id}-${part.t}`} className="rounded-sm bg-surface px-2 py-1 text-sm">
                              <span className={japanese ? "font-jp" : "font-display"}>{part.t}</span>
                              <span className="ml-2 text-xs text-muted">{part.g}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-sm leading-relaxed text-muted">{word.hook}</p>
                        <p lang={japanese ? "ja" : "en"} className="mt-3 text-sm">
                          {word.example}
                        </p>
                        <p className="mt-1 text-sm text-muted">{word.exampleZh}</p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
