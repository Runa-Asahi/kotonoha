// Builds public/words/<deck>.json
//  - English (toefl, cet6): KyleBing/english-vocabulary (BSD-3-Clause)
//  - Japanese (n1..n5): jamsinclair/open-anki-jlpt-decks (MIT)
//  - Curated v1 entries (Chinese meanings, mnemonics, examples) from data/legacy/curated.json go first.
// Entry format: [word, meaning, phrases?, reading?, extra?] where extra = [example, exampleZh, hook, parts]
// Usage: node scripts/build-words.mjs [cacheDir]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const cache = process.argv[2];
const KB = "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/";
const JL = "https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/";
const EN = { toefl: "6-托福-顺序.json", cet6: "4-CET6-顺序.json" };

async function get(url, local) {
  if (cache && existsSync(`${cache}/${local}`)) return readFile(`${cache}/${local}`, "utf8");
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
}

function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur.replace(/\r$/, "")); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const curated = JSON.parse(await readFile("data/legacy/curated.json", "utf8"));
function curatedEntries(deck) {
  return (curated[deck] ?? []).map((d) => {
    const isJa = deck.startsWith("n");
    const extra = [d.example, d.exampleZh, d.hook, d.parts.map((p) => `${p.t}=${p.g}`).join("|")];
    return [d.word, `${d.pos} ${d.meaning}`, [], isJa ? `${d.reading}${d.roma ? ` · ${d.roma}` : ""}` : d.ipa ?? "", extra];
  });
}

await mkdir("public/words", { recursive: true });
const counts = {};

for (const [deck, file] of Object.entries(EN)) {
  const raw = JSON.parse(await get(KB + encodeURIComponent(file), file));
  // English: keep source order (ids stay stable across versions); enrich curated words in place, append the rest.
  const cur = new Map(curatedEntries(deck).map((e) => [e[0].toLowerCase(), e]));
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const w = String(item.word || "").trim();
    if (!w || seen.has(w.toLowerCase()) || !/^[A-Za-z][A-Za-z' -]*$/.test(w)) continue;
    const meaning = (item.translations || []).map((t) => (t.type ? `${t.type}. ` : "") + String(t.translation).trim()).join("；");
    if (!meaning) continue;
    seen.add(w.toLowerCase());
    const phrases = (item.phrases || []).filter((p) => p.phrase && p.translation).slice(0, 3).map((p) => [p.phrase.trim(), p.translation.trim()]);
    const c = cur.get(w.toLowerCase());
    if (c) { out.push([w, meaning, phrases, c[3], c[4]]); cur.delete(w.toLowerCase()); }
    else out.push(phrases.length ? [w, meaning, phrases] : [w, meaning]);
  }
  out.push(...cur.values());
  await writeFile(`public/words/${deck}.json`, JSON.stringify(out));
  counts[deck] = out.length;
}

for (const n of [1, 2, 3, 4, 5]) {
  const deck = `n${n}`;
  const rows = parseCsv(await get(`${JL}n${n}.csv`, `n${n}.csv`)).slice(1);
  const out = curatedEntries(deck);
  const seen = new Set(out.map((e) => e[0]));
  for (const [expr, reading, meaning] of rows) {
    const w = (expr || "").trim();
    if (!w || !meaning || seen.has(w)) continue;
    seen.add(w);
    out.push([w, meaning.trim(), [], reading && reading !== w ? reading.trim() : ""]);
  }
  await writeFile(`public/words/${deck}.json`, JSON.stringify(out));
  counts[deck] = out.length;
}
await writeFile("src/data/counts.json", JSON.stringify(counts, null, 2) + "\n");
console.log(counts);
