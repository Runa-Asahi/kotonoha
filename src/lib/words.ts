export type Word = {
  id: number;
  word: string;
  meaning: string;
  phrases: [string, string][];
};

type Raw = [string, string, [string, string][]?];

let cache: Promise<Word[]> | null = null;

export function parseWords(raw: Raw[]): Word[] {
  return raw.map(([word, meaning, phrases], id) => ({ id, word, meaning, phrases: phrases ?? [] }));
}

export function loadWords(): Promise<Word[]> {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}words/toefl.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`词库加载失败（${r.status}）`);
        return r.json() as Promise<Raw[]>;
      })
      .then(parseWords)
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}
