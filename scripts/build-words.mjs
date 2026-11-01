// Builds public/words/toefl.json from KyleBing/english-vocabulary (BSD-3-Clause).
// Usage: node scripts/build-words.mjs [path-to-local-json]
import { readFile, writeFile, mkdir } from "node:fs/promises";

const SRC =
  "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/6-%E6%89%98%E7%A6%8F-%E9%A1%BA%E5%BA%8F.json";

const raw = process.argv[2]
  ? JSON.parse(await readFile(process.argv[2], "utf8"))
  : await (await fetch(SRC)).json();

const seen = new Set();
const out = [];
for (const item of raw) {
  const w = String(item.word || "").trim();
  if (!w || seen.has(w.toLowerCase()) || !/^[A-Za-z][A-Za-z' -]*$/.test(w)) continue;
  const meaning = (item.translations || [])
    .map((t) => (t.type ? `${t.type}. ` : "") + String(t.translation).trim())
    .join("；");
  if (!meaning) continue;
  seen.add(w.toLowerCase());
  const phrases = (item.phrases || [])
    .filter((p) => p.phrase && p.translation)
    .slice(0, 3)
    .map((p) => [p.phrase.trim(), p.translation.trim()]);
  out.push(phrases.length ? [w, meaning, phrases] : [w, meaning]);
}
await mkdir("public/words", { recursive: true });
await writeFile("public/words/toefl.json", JSON.stringify(out));
console.log(`wrote ${out.length} words`);
