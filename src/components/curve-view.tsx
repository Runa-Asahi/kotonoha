import { useEffect, useState } from "react";
import { LADDER, STAGE_LABEL, dayKey, shiftDay } from "@/lib/srs";
import { summarize, useMemory } from "@/lib/store";

const CURVE = [
  { t: "现在", forget: 100, keep: 100 },
  { t: "20分", forget: 58, keep: 94 },
  { t: "1时", forget: 44, keep: 92 },
  { t: "1天", forget: 33, keep: 90 },
  { t: "2天", forget: 28, keep: 88 },
  { t: "6天", forget: 25, keep: 86 },
  { t: "1月", forget: 21, keep: 90 },
];

type Charts = typeof import("recharts");

export function CurveView() {
  const snapshot = useMemory();
  const stats = summarize(snapshot);
  const [charts, setCharts] = useState<Charts | null>(null);

  useEffect(() => {
    void import("recharts").then(setCharts);
  }, []);

  const today = dayKey();
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = shiftDay(today, index - 6);
    return { t: key.slice(5), reviews: snapshot.log[key]?.reviews ?? 0, again: snapshot.log[key]?.again ?? 0 };
  });
  const reviewed = days.some((day) => day.reviews > 0);
  const placed = stats.stages.some((count) => count > 0);

  return (
    <div className="px-5 pt-6">
      <p className="text-xs tracking-widest text-subtle">记忆</p>
      <h1 className="mt-1 font-display text-3xl leading-tight">遗忘曲线</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        艾宾浩斯在 1885 年发现：刚记住的内容，如果不复习，会先快后慢地忘掉。言叶把复习放在掉得最快的节点上。
      </p>

      <div className="mt-5 h-56 rounded-xl border border-border bg-surface px-2 py-3">
        {charts ? (
          <charts.ResponsiveContainer width="100%" height="100%">
            <charts.LineChart data={CURVE} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <charts.CartesianGrid stroke="var(--color-border)" vertical={false} />
              <charts.XAxis
                dataKey="t"
                tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <charts.YAxis
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                width={32}
                tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <charts.Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-fg)",
                  fontSize: 12,
                }}
              />
              <charts.Line
                type="monotone"
                dataKey="forget"
                name="不复习"
                stroke="var(--color-subtle)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <charts.Line
                type="monotone"
                dataKey="keep"
                name="按节点复习"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </charts.LineChart>
          </charts.ResponsiveContainer>
        ) : (
          <div className="h-full" />
        )}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-subtle">
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-px w-4 bg-subtle" />
          不复习
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="inline-block h-0.5 w-4 bg-accent" />
          按节点复习
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-subtle">
        灰线是常见的示意数据，不是某一份实验记录的精确抄录。浅线是按节点复习后大致能留下的部分。
      </p>

      <h2 className="mt-8 text-sm text-muted">言叶使用的节点</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {LADDER.map((label) => (
          <span key={label} className="rounded-sm border border-border bg-surface px-2 py-1 text-xs text-muted">
            {label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-subtle">
        记住，就走到下一格。很容易，跳过一格。生疏，停在原处、时间减半。忘记，一分钟后再看，并回到起点。
      </p>

      <h2 className="mt-8 text-sm text-muted">你的单词</h2>
      {placed ? (
        <ul className="mt-3">
          {stats.stages.map((count, stage) =>
            count > 0 ? (
              <li key={STAGE_LABEL[stage]} className="flex items-center gap-3 py-2">
                <span className="w-16 shrink-0 text-xs text-subtle">{stage === 0 ? "待巩固" : STAGE_LABEL[stage]}</span>
                <span className="h-1 flex-1 rounded-sm bg-elevated">
                  <span
                    className="block h-1 rounded-sm bg-accent"
                    style={{ width: `${Math.max(8, (count / Math.max(stats.seen, 1)) * 100)}%` }}
                  />
                </span>
                <span className="w-6 text-right text-sm tabular-nums">{count}</span>
              </li>
            ) : null,
          )}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">还没有单词进入阶梯。学过一张之后，会停在对应的节点上。</p>
      )}

      <h2 className="mt-8 text-sm text-muted">近七日</h2>
      {reviewed && charts ? (
        <div className="mt-3 h-40">
          <charts.ResponsiveContainer width="100%" height="100%">
            <charts.BarChart data={days} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <charts.XAxis
                dataKey="t"
                tick={{ fill: "var(--color-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <charts.YAxis hide />
              <charts.Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-fg)",
                  fontSize: 12,
                }}
              />
              <charts.Bar dataKey="reviews" name="复习" fill="var(--color-accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </charts.BarChart>
          </charts.ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">复习之后，这里会记下每天的量。</p>
      )}
    </div>
  );
}
