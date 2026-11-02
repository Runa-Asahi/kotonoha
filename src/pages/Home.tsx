import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Keyboard, Languages, Settings, BookText } from "lucide-react";
import { useWords } from "../lib/useWords";
import { useDeckState, useToday } from "../lib/today";
import { Loading } from "../components/Loading";
import { ProgressRing } from "../components/ProgressRing";
import { LazyDeckPicker as DeckPicker } from "../components/LazyDeckPicker";
import { useStore, dayTotal, type Log } from "../store";
import { dayKey } from "../lib/srs";
import { SEASONS, seasonOf } from "../lib/theme";
import { haptic } from "../lib/haptics";

export function streak(log: Log, now = Date.now()) {
  let s = 0;
  const has = (t: number) => { const e = dayTotal(log[dayKey(t)]); return e.n + e.r > 0; };
  let t = now;
  if (!has(t)) t -= 864e5;
  while (has(t)) { s++; t -= 864e5; }
  return s;
}

const WD = ["日", "一", "二", "三", "四", "五", "六"];

function Week({ deck }: { deck: Parameters<typeof useDeckState>[0] }) {
  const log = useStore((s) => s.log);
  const { cards } = useDeckState(deck);
  const days = useMemo(() => {
    const now = Date.now();
    const list = Object.values(cards);
    return Array.from({ length: 7 }, (_, i) => {
      const off = i - 3;
      const t = now + off * 864e5;
      const k = dayKey(t);
      const done = dayTotal(log[k]);
      const end = new Date(t); end.setHours(28, 0, 0, 0);
      const start = end.getTime() - 864e5;
      const due = off > 0 ? list.filter((c) => c.due > start && c.due <= end.getTime()).length : 0;
      const d = new Date(t - 4 * 3600e3);
      return { k, off, wd: WD[d.getDay()], date: d.getDate(), studied: done.n + done.r, due };
    });
  }, [cards, log]);
  return (
    <ol className="grid grid-cols-7 gap-1 text-center" aria-label="本周学习日历">
      {days.map((d) => (
        <li key={d.k} className={`rounded-xl py-2 ${d.off === 0 ? "bg-elevated" : ""}`}>
          <p className="text-[10px] text-subtle">{d.off === 0 ? "今" : d.wd}</p>
          <p className={`mt-0.5 font-word text-base ${d.off === 0 ? "text-fg" : "text-muted"}`}>{d.date}</p>
          <p className="mt-1 grid h-5 place-items-center text-[10px]">
            {d.off <= 0 ? (d.studied > 0 ? <span className="hanko size-5 text-[10px]" title={`学习 ${d.studied}`}>済</span> : <span className="text-subtle">·</span>)
              : d.due > 0 ? <span className="text-accent tabular-nums">{d.due}</span> : <span className="text-subtle">·</span>}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  const { words, error, retry, deck } = useWords();
  const t = useToday(deck.id, words);
  const log = useStore((s) => s.log);
  const addExtra = useStore((s) => s.addExtra);
  const [picker, setPicker] = useState(false);
  const [, nav] = useLocation();
  const st = streak(log);
  const seasonSetting = useStore((s) => s.settings.season);
  const season = SEASONS[seasonSetting === "auto" ? seasonOf() : seasonSetting];

  const header = (
    <header className="flex items-start justify-between gap-4 pt-2">
      <div>
        <p className="eyebrow">ことのは · {season.label}・{season.kigo}</p>
        <h1 className="mt-1 font-jp text-[34px] leading-none ">言叶</h1>
      </div>
      <div className="flex items-center gap-2">
        {st > 0 && <span className="hanko h-9 px-2 text-xs" aria-label={`连续 ${st} 天`}>{st}日</span>}
        <Link href="/settings" aria-label="设置" className="press grid size-11 place-items-center rounded-full border border-border bg-surface"><Settings className="size-5" strokeWidth={1.6} /></Link>
      </div>
    </header>
  );
  const deckBtn = (
    <button onClick={() => setPicker(true)} className="press mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3 pl-1.5 text-sm">
      <span className="grid size-7 place-items-center rounded-full bg-ink font-jp text-xs text-ink-fg">{deck.lang === "ja" ? "日" : "英"}</span>
      <span className="font-medium">{deck.label}</span>
      <span className="font-word text-xs italic text-subtle">{deck.level}</span>
      <ChevronDown className="size-4 text-subtle" />
    </button>
  );

  if (!t) return <>{header}{deckBtn}<Loading error={error} retry={retry} /><DeckPicker open={picker} onClose={() => setPicker(false)} /></>;

  const pending = t.review.length + t.fresh.length;
  const done = t.today.n + t.today.r;
  const finished = pending === 0;
  const acc = done ? Math.round((t.today.ok / done) * 100) : 0;
  const go = () => {
    haptic("medium");
    if (finished && t.unlearned > 0) addExtra(deck.id, 10);
    nav("/study");
  };

  return (
    <div className="space-y-5">
      {header}
      {deckBtn}

      <section className="card relative overflow-hidden p-5" aria-labelledby="today-h">
        <div className="flex items-center gap-5">
          <ProgressRing value={done / Math.max(1, done + pending)}>
            <div>
              <p className="eyebrow !tracking-[0.2em]">今日</p>
              <p className="font-word text-[44px] leading-none tabular-nums">{pending}</p>
              <p className="mt-1 text-[11px] text-subtle">{finished ? "全部完成" : "待完成"}</p>
            </div>
          </ProgressRing>
          <dl className="flex-1 space-y-3">
            <div><dt className="text-xs text-subtle">新词</dt><dd className="font-word text-2xl tabular-nums">{t.fresh.length}</dd></div>
            <div><dt className="text-xs text-subtle">复习</dt><dd className="font-word text-2xl tabular-nums">{t.review.length}</dd></div>
            <div><dt className="text-xs text-subtle">已完成 · 正确率</dt><dd className="font-word text-lg tabular-nums">{done}<span className="text-subtle"> · {acc}%</span></dd></div>
          </dl>
        </div>
        <h2 id="today-h" className="sr-only">今日任务</h2>
        <button onClick={go} disabled={finished && t.unlearned === 0} className="btn-ink mt-5 w-full text-base">
          {finished ? (t.unlearned > 0 ? "今日已完成 · 再学 10 个" : "这本词书已学完") : done ? "继续学习" : t.review.length ? "开始复习" : "学习新词"}
        </button>
      </section>

      <section className="card p-4">
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-sm text-muted">学习日历</h2>
          <Link href="/stats" className="text-xs text-subtle">完整曲线 ›</Link>
        </div>
        <Week deck={deck.id} />
        <p className="mt-2 px-1 text-[11px] text-subtle">「済」= 当天学过，数字 = 那天要复习的词</p>
      </section>

      <div className="grid grid-cols-3 gap-3">
        {[
          { to: "/spell", Icon: Keyboard, t: deck.lang === "ja" ? "读音" : "拼写", s: "练习" },
          { to: "/kana", Icon: Languages, t: "五十音", s: "纸灯町" },
          { to: "/words", Icon: BookText, t: "词库", s: `${t.learned}/${t.total}` },
        ].map(({ to, Icon, t: title, s }) => (
          <Link key={to} href={to} className="card press flex flex-col gap-3 p-4">
            <Icon className="size-5 text-accent" strokeWidth={1.7} />
            <span><span className="block text-sm font-medium">{title}</span><span className="block text-[11px] text-subtle tabular-nums">{s}</span></span>
          </Link>
        ))}
      </div>

      {t.learned === 0 && (
        <section className="card space-y-2 p-5 text-sm leading-relaxed text-muted">
          <h2 className="font-jp text-base text-fg">怎么学</h2>
          <p>看到单词，先在心里回忆意思 → 选「认识 / 模糊 / 忘记」，或者<b className="text-fg">向右滑 = 认识，向左滑 = 忘记</b>。</p>
          <p>翻面核对：记错了就点「记错了」，太熟的词点「太简单」以后不再出现。</p>
          <p>FSRS 算法会在你快要忘记的时候再把它排回来。</p>
        </section>
      )}
      <DeckPicker open={picker} onClose={() => setPicker(false)} />
    </div>
  );
}
