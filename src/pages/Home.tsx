import { Link } from "wouter";
import { useWords } from "../lib/useWords";
import { useToday } from "../lib/today";
import { Loading } from "../components/Loading";
import { useStore } from "../store";
import { dayKey } from "../lib/srs";

function streak(log: Record<string, { n: number; r: number }>) {
  let s = 0;
  const d = new Date();
  d.setHours(d.getHours() - 4);
  if (!log[dayKey(Date.now())]) d.setDate(d.getDate() - 1);
  for (;;) {
    const k = dayKey(d.getTime() + 4 * 3600e3);
    const e = log[k];
    if (!e || e.n + e.r === 0) return s;
    s++;
    d.setDate(d.getDate() - 1);
  }
}

export default function Home() {
  const { words, error, retry } = useWords();
  const t = useToday(words);
  const log = useStore((s) => s.log);
  const dailyNew = useStore((s) => s.settings.dailyNew);
  if (!t) return <Loading error={error} retry={retry} />;
  const pending = t.review.length + t.fresh.length;
  const done = t.today.n + t.today.r;
  const pct = Math.round((t.learned / t.total) * 100);
  const st = streak(log);
  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">言叶</h1>
          <p className="text-sm text-slate-500">新托福核心词汇 · {t.total.toLocaleString()} 词</p>
        </div>
        {st > 0 && <p className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">🔥 连续 {st} 天</p>}
      </header>

      <section className="card p-5" aria-labelledby="today-h">
        <h2 id="today-h" className="text-sm font-medium text-slate-500">今日任务</h2>
        <div className="mt-3 grid grid-cols-3 text-center">
          <div><p className="text-3xl font-bold text-brand-600">{t.fresh.length}</p><p className="text-xs text-slate-500">待学新词</p></div>
          <div><p className="text-3xl font-bold text-amber-600">{t.review.length}</p><p className="text-xs text-slate-500">待复习</p></div>
          <div><p className="text-3xl font-bold">{done}</p><p className="text-xs text-slate-500">今日已完成</p></div>
        </div>
        {pending > 0 ? (
          <Link href="/study" className="btn-primary mt-5 w-full text-lg">{done ? "继续学习" : "开始学习"}</Link>
        ) : (
          <div className="mt-5 rounded-xl bg-brand-50 p-4 text-center text-brand-700 dark:bg-slate-800 dark:text-brand-500">
            🎉 今日任务已完成！{t.today.n >= dailyNew && "可以在设置中调高每日新词数，或去练习拼写。"}
          </div>
        )}
        {t.learned > 0 && <Link href="/spell" className="btn-ghost mt-3 w-full">拼写练习</Link>}
      </section>

      <section className="card p-5" aria-labelledby="prog-h">
        <div className="flex items-baseline justify-between">
          <h2 id="prog-h" className="text-sm font-medium text-slate-500">词库进度</h2>
          <span className="text-sm text-slate-500">{t.learned} / {t.total}（{pct}%）</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="词库进度">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(pct, t.learned ? 1 : 0)}%` }} />
        </div>
        <p className="mt-3 text-xs text-slate-500">已掌握（跳过）{t.known} 词 · 按 FSRS 记忆模型安排复习</p>
      </section>

      {t.learned === 0 && (
        <section className="card space-y-2 p-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">怎么学？</h2>
          <p>1. 先看单词，<b>在心里回忆</b>意思，再选「认识 / 模糊 / 忘记」。</p>
          <p>2. 看答案确认，记错了可以点「记错了」纠正。</p>
          <p>3. 已经很熟的词点「太简单」，以后不再出现。</p>
          <p>4. 每天回来完成复习，算法会在你快忘记时提醒你。</p>
        </section>
      )}
    </div>
  );
}
