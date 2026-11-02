// Builds public/words/<deck>.json
//  - English (toefl, cet6, cet4): KyleBing/english-vocabulary (BSD-3-Clause)
//  - English (ielts): ECDICT words tagged "ielts" (MIT), ordered by frequency
//  - Japanese (n1..n5): jamsinclair/open-anki-jlpt-decks (MIT)
//  - Curated v1 entries (Chinese meanings, mnemonics, examples) from data/legacy/curated.json go first.
// Entry format: [word, meaning, phrases, reading, extra|0, alt, forms?]  (forms: ECDICT exchange, EN only)
//   EN: reading = US IPA, alt = UK IPA.  JA: reading = kana, alt = Hepburn romaji.
//   extra = [example, exampleZh, hook, parts]
// Hepburn romaji; long vowels kept as written (おう -> ou), ー handled by wanakana.
export const romaji = (kana) => toRomaji(kana, { upcaseKatakana: false });
// Usage: node scripts/build-words.mjs [cacheDir]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { toRomaji } from "wanakana";

// ---- IPA sources ----
// UK-style: ECDICT phonetic field (MIT, skywind3000/ECDICT). US: CMUdict (BSD-2) converted from ARPAbet.
import { arpaToIpa } from "./ipa.mjs";
let US = null, UK = null;
async function loadIpa() {
  if (US) return;
  US = new Map(); UK = new Map();
  const cmu = await get("https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict", "cmudict.dict");
  for (const line of cmu.split("\n")) {
    const m = line.match(/^([a-z'.-]+)\s+(.+?)(\s+#.*)?$/);
    if (m && !US.has(m[1])) US.set(m[1], arpaToIpa(m[2]));
  }
  const ec = parseCsv(await get("https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv", "ecdict.csv"));
  FORMS = new Map();
  for (const row of ec) {
    const w = (row[0] || "").toLowerCase();
    if (!w || UK.has(w)) continue;
    const ph = (row[1] || "").trim();
    if (ph) UK.set(w, modernUK(ph.replace(/'/g, "ˈ").replace(/,/g, "ˌ").replace(/:/g, "ː").replace(/[\u04d9\u0259]/g, "ə").replace(/g/g, "ɡ")));
    const ex = (row[10] || "").split("/").filter((x) => /^[pdi3srt]:/.test(x)).join("/");
    if (ex) FORMS.set(w, ex);
    if ((row[7] || "").split(" ").includes("ielts") && !(row[7] || "").split(" ").includes("zk") && /^[a-z][a-z' -]*$/.test(w)) IELTS.push(row);
  }
}
let FORMS = null;
// ECDICT mixes old Jones notation (/keis/, /həum/, /ˈsistəm/) with modern (/keɪs/). Normalize to modern.
function modernUK(p) {
  // variants: "sjuːt. suːt", "əˈbjuːs.əˈbjuːz" -> keep the first
  p = p.split(/\.\s+/)[0];
  const m = p.match(/^(.*ˈ.*?)\.(?=[^.]*ˈ)/); if (m && /ˈ/.test(m[1])) p = m[1];
  p = p.replace(/\./g, "ˌ").replace(/є/g, "e").trim();
  if (/[ɪʊ]/.test(p)) return p;
  p = p.replace(/ɒi/g, "ɔɪ");
  return p.replace(/ei/g, "eɪ").replace(/ai/g, "aɪ").replace(/ɔi/g, "ɔɪ").replace(/əu/g, "əʊ").replace(/au/g, "aʊ")
    .replace(/[ɛε]ə/g, "eə").replace(/iə/g, "ɪə").replace(/uə/g, "ʊə")
    .replace(/i(?!ː|:)/g, "ɪ").replace(/u(?!ː|:)/g, "ʊ").replace(/ɪ:/g, "iː").replace(/ʊ:/g, "uː").replace(/ɒː/g, "ɔː");
}
const IELTS = [];
const ipaOf = (w) => { const k = w.toLowerCase(); return [US.get(k) ?? "", UK.get(k) ?? ""]; };

const cache = process.argv[2];
const KB = "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/";
const JL = "https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/";
const EN = { toefl: "6-托福-顺序.json", cet6: "4-CET6-顺序.json", cet4: "3-CET4-顺序.json" };

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
    return [d.word, `${d.pos} ${d.meaning}`, [], isJa ? d.reading : d.ipa ?? "", extra];
  });
}

await mkdir("public/words", { recursive: true });
const counts = {};

await loadIpa();
const cover = {};
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
    const [us, uk] = ipaOf(w);
    const fallback = c?.[3]?.replace(/^\/|\/$/g, "") ?? "";
    const e = [w, meaning, phrases, us || fallback, c ? c[4] : 0, uk || (us ? "" : fallback)];
    if (FORMS.get(w.toLowerCase())) e.push(FORMS.get(w.toLowerCase()));
    out.push(e);
    if (c) cur.delete(w.toLowerCase());
  }
  for (const c of cur.values()) { const [us, uk] = ipaOf(c[0]); out.push([c[0], c[1], c[2], us || c[3].replace(/^\/|\/$/g, ""), c[4], uk]); }
  cover[deck] = { us: out.filter((e) => e[3]).length, uk: out.filter((e) => e[5]).length, any: out.filter((e) => e[3] || e[5]).length, total: out.length };
  await writeFile(`public/words/${deck}.json`, JSON.stringify(out));
  counts[deck] = out.length;
}

{
  // IELTS from ECDICT: frequency order (frq, then bnc; 0 = unknown goes last)
  const rank = (r) => +r[9] || +r[8] || 1e9;
  const rows = [...IELTS].sort((a, b) => rank(a) - rank(b));
  const out = []; const seen = new Set();
  const cur = new Map(curatedEntries("ielts").map((e) => [e[0].toLowerCase(), e]));
  for (const r of rows) {
    const w = r[0].trim(); const k = w.toLowerCase();
    if (seen.has(k)) continue;
    const meaning = (r[3] || "").replace(/\\r/g, "").split("\\n").map((x) => x.trim()).filter((x) => x && !/^\[(网络|计|医|化|经|法|地|史|军|生|植|动|电|物|数|天|建|机|矿|冶|船|纺|农|语|音|宗|体|乐|心|印|无|自|经管)\]/.test(x)).slice(0, 4).join("；");
    if (!meaning) continue;
    seen.add(k);
    const [us, uk] = ipaOf(w);
    const e = [w, meaning, [], us, cur.get(k)?.[4] ?? 0, uk];
    if (FORMS.get(k)) e.push(FORMS.get(k));
    out.push(e);
  }
  cover.ielts = { us: out.filter((e) => e[3]).length, uk: out.filter((e) => e[5]).length, any: out.filter((e) => e[3] || e[5]).length, total: out.length };
  await writeFile("public/words/ielts.json", JSON.stringify(out));
  counts.ielts = out.length;
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
    out.push([w, meaning.trim(), [], reading && reading !== w ? reading.trim() : "", 0]);
  }
  for (const e of out) e[5] = romaji(e[3] || e[0]);
  await writeFile(`public/words/${deck}.json`, JSON.stringify(out));
  counts[deck] = out.length;
}
console.log("IPA coverage", cover);
await writeFile("data/ipa-coverage.json", JSON.stringify(cover, null, 2) + "\n");
await writeFile("src/data/counts.json", JSON.stringify(counts, null, 2) + "\n");
console.log(counts);
