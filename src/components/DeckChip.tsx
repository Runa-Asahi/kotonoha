import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { deckOf } from "../lib/decks";
import { useStore } from "../store";
import { LazyDeckPicker as DeckPicker } from "./LazyDeckPicker";

export function DeckChip() {
  const deck = deckOf(useStore((s) => s.settings.deck));
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="press inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1.5 pr-2.5 pl-3 text-sm">
        {deck.label}<span className="font-word text-xs italic text-subtle">{deck.level}</span><ChevronDown className="size-4 text-subtle" />
      </button>
      <DeckPicker open={open} onClose={() => setOpen(false)} />
    </>
  );
}
