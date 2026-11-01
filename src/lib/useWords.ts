import { useEffect, useState } from "react";
import { loadWords, type Word } from "./words";

export function useWords() {
  const [state, setState] = useState<{ words: Word[] | null; error: string | null }>({ words: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    loadWords().then(
      (words) => alive && setState({ words, error: null }),
      (e: Error) => alive && setState({ words: null, error: e.message }),
    );
    return () => {
      alive = false;
    };
  }, [attempt]);
  return { ...state, retry: () => setAttempt((a) => a + 1) };
}
