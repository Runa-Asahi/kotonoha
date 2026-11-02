import { Check } from "lucide-react";
import { DECKS } from "../lib/decks";
import { useStore } from "../store";
import { haptic } from "../lib/haptics";
import { Sheet } from "./Sheet";

export function DeckPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const deck = useStore((s) => s.settings.deck);
  const cards = useStore((s) => s.cards);
  const setSettings = useStore((s) => s.setSettings);
  const learned: Record<string, number> = {};
  for (const k in cards) { const d = k.slice(0, k.indexOf(":")); learned[d] = (learned[d] ?? 0) + 1; }
  const group = (lang: "en" | "ja") => DECKS.filter((d) => d.lang === lang);
  return (
    <Sheet open={open} onClose={onClose} title="切换词书">
      <p className="-mt-1 mb-4 text-sm text-muted">每本词书的进度和每日任务互不影响。</p>
      {(["en", "ja"] as const).map((lang) => (
        <section key={lang} className="mb-5">
          <h3 className="eyebrow mb-2">{lang === "en" ? "ENGLISH · 英语" : "日本語 · 日语"}</h3>
          <ul className="space-y-2">
            {group(lang).map((d) => {
              const on = d.id === deck;
              const n = learned[d.id] ?? 0;
              return (
                <li key={d.id}>
                  <button onClick={() => { haptic("medium"); setSettings({ deck: d.id }); onClose(); }} aria-pressed={on}
                    className={`press flex w-full items-center gap-4 rounded-2xl border p-3 text-left ${on ? "border-fg bg-elevated" : "border-border"}`}>
                    <span className={`grid size-12 shrink-0 place-items-center rounded-xl font-jp text-lg ${on ? "bg-ink text-ink-fg" : "bg-elevated"}`}>
                      {lang === "ja" ? d.label : d.id === "toefl" ? "托" : "六"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{d.label} <span className="font-word text-sm italic text-subtle">{d.level}</span></span>
                      <span className="mt-1 block h-1 overflow-hidden rounded-full bg-elevated"><span className="block h-full bg-accent" style={{ width: `${(n / d.count) * 100}%` }} /></span>
                      <span className="mt-1 block text-xs text-subtle">{n} / {d.count.toLocaleString()} 词 · {d.desc}</span>
                    </span>
                    {on && <Check className="size-5 text-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Sheet>
  );
}
