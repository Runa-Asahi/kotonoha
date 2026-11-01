import { useEffect, useState } from "react";
import { loadDeck, type Word } from "./words";
import { useStore } from "../store";
import { deckOf, type Deck } from "./decks";

export function useWords(): { words: Word[] | null; error: string | null; retry: () => void; deck: Deck } {
  const deckId = useStore((s) => s.settings.deck);
  const [state, setState] = useState<{ key: string; words: Word[] | null; error: string | null }>({ key: "", words: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    loadDeck(deckId).then(
      (words) => alive && setState({ key: deckId, words, error: null }),
      (e: Error) => alive && setState({ key: deckId, words: null, error: e.message }),
    );
    return () => {
      alive = false;
    };
  }, [deckId, attempt]);
  const fresh = state.key === deckId;
  return { words: fresh ? state.words : null, error: fresh ? state.error : null, retry: () => setAttempt((a) => a + 1), deck: deckOf(deckId) };
}
