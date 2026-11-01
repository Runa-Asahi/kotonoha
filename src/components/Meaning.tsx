import type { Word } from "../lib/words";

export function Meaning({ w, highlight = true }: { w: Word; highlight?: boolean }) {
  return (
    <div className="space-y-3 text-left">
      <ul className="space-y-1">
        {w.meaning.split("；").map((m, i) => {
          const [, pos, rest] = m.match(/^([a-z]+\.)\s*(.*)$/) ?? [null, "", m];
          return (
            <li key={i} className="leading-relaxed">
              {pos && <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{pos}</span>}
              {rest}
            </li>
          );
        })}
      </ul>
      {w.phrases.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-medium tracking-wide text-slate-400">短语例句</h3>
          <ul className="space-y-1.5 text-sm">
            {w.phrases.map(([en, zh]) => (
              <li key={en}>
                <span className={highlight ? "font-medium text-brand-700 dark:text-brand-500" : ""}>{en}</span>
                <span className="ml-2 text-slate-500">{zh}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
