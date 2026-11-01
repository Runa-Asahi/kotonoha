import type { Word } from "../lib/words";
import { SpeakButton } from "./SpeakButton";

export function Meaning({ w, lang = "en" }: { w: Word; lang?: "en" | "ja" }) {
  const senses = lang === "ja" && !/[\u4e00-\u9fff]/.test(w.meaning) ? w.meaning.split(/,\s*/) : w.meaning.split("；");
  return (
    <div className="space-y-4 text-left">
      {lang === "ja" && !/[\u4e00-\u9fff]/.test(w.meaning) && <p className="text-xs text-slate-400">英文释义</p>}
      <ul className="space-y-1">
        {senses.map((m, i) => {
          const [, pos, rest] = m.match(/^([a-z]+\.)\s*(.*)$/) ?? [null, "", m];
          return (
            <li key={i} className="leading-relaxed">
              {pos && <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{pos}</span>}
              {rest}
            </li>
          );
        })}
      </ul>
      {w.parts && w.parts.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-medium tracking-wide text-slate-400">{lang === "ja" ? "汉字拆解" : "词根词缀"}</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {w.parts.map((p) => (
              <span key={p.t + p.g} className="rounded-lg bg-brand-50 px-2 py-1 dark:bg-slate-800"><b className="text-brand-700 dark:text-brand-500">{p.t}</b> {p.g}</span>
            ))}
          </div>
          {w.hook && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">💡 {w.hook}</p>}
        </div>
      )}
      {w.example && (
        <div>
          <h3 className="mb-1 text-xs font-medium tracking-wide text-slate-400">例句</h3>
          <p className="flex items-start gap-1 text-sm">
            <span className="flex-1">{w.example}</span>
            <SpeakButton text={w.example} lang={lang} label="朗读例句" className="-mt-2 h-8 w-8 shrink-0" />
          </p>
          <p className="text-sm text-slate-500">{w.exampleZh}</p>
        </div>
      )}
      {w.phrases.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-medium tracking-wide text-slate-400">常用短语</h3>
          <ul className="space-y-1.5 text-sm">
            {w.phrases.map(([en, zh]) => (
              <li key={en}><span className="font-medium text-brand-700 dark:text-brand-500">{en}</span><span className="ml-2 text-slate-500">{zh}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
