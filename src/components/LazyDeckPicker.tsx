import { lazy, Suspense, useState } from "react";

const DeckPicker = lazy(() => import("./DeckPicker").then((m) => ({ default: m.DeckPicker })));

/** Loads the sheet (and the animation library) only the first time it opens. */
export function LazyDeckPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [used, setUsed] = useState(false);
  if (open && !used) setUsed(true);
  if (!used) return null;
  return <Suspense fallback={null}><DeckPicker open={open} onClose={onClose} /></Suspense>;
}
