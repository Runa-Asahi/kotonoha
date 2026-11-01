import { DECKS } from "../lib/decks";
import { useStore } from "../store";

export function DeckSwitcher() {
  const deck = useStore((s) => s.settings.deck);
  const cards = useStore((s) => s.cards);
  const setSettings = useStore((s) => s.setSettings);
  const learned: Record<string, number> = {};
  for (const k in cards) { const d = k.slice(0, k.indexOf(":")); learned[d] = (learned[d] ?? 0) + 1; }
  return (
    <div role="radiogroup" aria-label="选择词书" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {DECKS.map((d) => {
        const on = d.id === deck;
        return (
          <button key={d.id} role="radio" aria-checked={on} onClick={() => setSettings({ deck: d.id })}
            className={`shrink-0 rounded-xl px-3 py-2 text-left ring-1 transition-colors ${on ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800"}`}>
            <span className="block text-sm font-semibold">{d.lang === "ja" ? "🇯🇵 " : "🇺🇸 "}{d.label}</span>
            <span className={`block text-[11px] ${on ? "text-white/80" : "text-slate-500"}`}>{learned[d.id] ?? 0}/{d.count}</span>
          </button>
        );
      })}
    </div>
  );
}
