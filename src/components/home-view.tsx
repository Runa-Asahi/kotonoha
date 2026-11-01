import * as Dialog from "@radix-ui/react-dialog";
import { Settings } from "lucide-react";
import { useState } from "react";
import { DECKS } from "@/data/types";
import { WORDS } from "@/data/words";
import { cn } from "@/lib/cn";
import { LADDER } from "@/lib/srs";
import { summarize, useMemory } from "@/lib/store";

const LIMITS = [5, 10, 20];

export function HomeView({
  running,
  onStudy,
  onMore,
  onLexicon,
}: {
  running: boolean;
  onStudy: () => void;
  onMore: () => void;
  onLexicon: () => void;
}) {
  const selected = useMemory((state) => state.selected);
  const toggleDeck = useMemory((state) => state.toggleDeck);
  const newPerDay = useMemory((state) => state.newPerDay);
  const setNewPerDay = useMemory((state) => state.setNewPerDay);
  const reset = useMemory((state) => state.reset);
  const snapshot = useMemory();
  const stats = summarize(snapshot);
  const todayCount = stats.due + stats.newLeft;
  const more = !running && stats.due === 0 && stats.newLeft === 0 && stats.fresh > 0;
  const done = !running && todayCount === 0 && stats.fresh === 0;

  let action = "开始复习";
  if (running) action = "继续复习";
  else if (stats.due === 0 && stats.newLeft > 0) action = "学习新词";
  else if (more) action = "再学 10 个";
  else if (done) action = "这几门已经学完";

  return (
    <div className="px-5 pt-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-subtle">ことのは</p>
          <h1 className="font-jp text-3xl leading-tight">言叶</h1>
          <p className="mt-1 text-sm text-muted">英语与日语，按遗忘曲线留下。</p>
        </div>
        <SettingsDialog
          newPerDay={newPerDay}
          onLimit={setNewPerDay}
          onReset={reset}
        />
      </header>

      <section className="mt-8">
        <p className="text-sm text-muted">今日要学</p>
        <p className="font-display text-7xl leading-none tabular-nums">{todayCount}</p>
        <p className="mt-3 text-sm text-muted">
          待复习 {stats.due} · 新词 {stats.newLeft}
          {stats.todayReviews > 0 ? ` · 已记 ${stats.todayReviews}` : ""}
        </p>
      </section>

      <button
        type="button"
        className="press mt-6 flex h-12 w-full items-center justify-center rounded-md bg-accent text-base font-medium text-accent-fg disabled:opacity-40"
        onClick={more ? onMore : onStudy}
        disabled={done}
      >
        {action}
      </button>

      <section className="mt-8">
        <h2 className="text-sm text-muted">课程</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {DECKS.map((deck) => {
            const on = selected.includes(deck.id);
            const count = WORDS.filter((word) => word.deck === deck.id).length;
            return (
              <button
                key={deck.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDeck(deck.id)}
                className={cn(
                  "press min-h-14 min-w-16 rounded-md border px-3 py-2 text-left",
                  on ? "border-transparent bg-accent text-accent-fg" : "border-border bg-surface text-fg",
                )}
              >
                <span className="block text-sm font-medium">{deck.label}</span>
                <span className={cn("block text-xs", on ? "text-accent-fg/70" : "text-subtle")}>
                  {deck.level} · {count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-subtle">至少留一门。点选后，下一组学习会换上这些词。</p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm text-muted">复习节点</h2>
        <div className="mt-3 overflow-x-auto">
          <div className="flex w-max gap-2 pb-1">
            {LADDER.map((label, index) => (
              <div
                key={label}
                className="w-16 shrink-0 rounded-md border border-border bg-surface px-2 py-2"
              >
                <p className="text-xs text-subtle">{label}</p>
                <p className="mt-1 font-display text-xl leading-none tabular-nums">{stats.stages[index + 1] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <dl className="mt-6 grid grid-cols-3 gap-2">
        {[
          ["连续", `${stats.streak} 天`],
          ["已学", String(stats.seen)],
          ["稳住", String(stats.stable)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-border bg-surface px-3 py-3">
            <dt className="text-xs text-subtle">{label}</dt>
            <dd className="mt-1 font-display text-xl leading-none tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-subtle">连续学过的天数。稳住指已经走到 7 天节点的词。</p>

      <button
        type="button"
        onClick={onLexicon}
        className="press mt-6 mb-2 flex h-12 w-full items-center justify-center rounded-md border border-border bg-surface text-sm font-medium"
      >
        浏览词库 · {stats.pool}
      </button>
    </div>
  );
}

function SettingsDialog({
  newPerDay,
  onLimit,
  onReset,
}: {
  newPerDay: number;
  onLimit: (count: number) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirm(false);
      }}
    >
      <Dialog.Trigger
        className="press grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface"
        aria-label="设置"
      >
        <Settings className="size-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/80" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-border bg-surface p-5">
          <Dialog.Title className="font-display text-2xl leading-tight">设置</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted">
            进度只留在这台设备上。到期的旧词不受每日新词数量限制。
          </Dialog.Description>
          <p className="mt-5 text-sm text-muted">每日新词</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {LIMITS.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={newPerDay === count}
                onClick={() => onLimit(count)}
                className={cn(
                  "press h-11 rounded-md border text-sm font-medium",
                  newPerDay === count
                    ? "border-transparent bg-accent text-accent-fg"
                    : "border-border bg-elevated text-fg",
                )}
              >
                {count}
              </button>
            ))}
          </div>
          <div className="mt-6">
            {confirm ? (
              <div>
                <p className="text-sm">会清除这台设备上的复习记录，词库本身还在。</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="press h-11 rounded-md border border-border text-sm text-again"
                    onClick={() => {
                      onReset();
                      setConfirm(false);
                      setOpen(false);
                    }}
                  >
                    清除记录
                  </button>
                  <button
                    type="button"
                    className="press h-11 rounded-md bg-accent text-sm font-medium text-accent-fg"
                    onClick={() => setConfirm(false)}
                  >
                    留下
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="press h-11 w-full rounded-md border border-border text-sm text-muted"
                onClick={() => setConfirm(true)}
              >
                重置学习记录
              </button>
            )}
          </div>
          <Dialog.Close className="press mt-4 h-11 w-full rounded-md bg-elevated text-sm font-medium">
            完成
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
