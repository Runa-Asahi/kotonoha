// ARPAbet (CMUdict) -> IPA with syllable-onset stress placement
const ARPA = { AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", B: "b", CH: "tʃ", D: "d", DH: "ð", EH: "ɛ", ER: "ɝ", EY: "eɪ", F: "f", G: "ɡ", HH: "h", IH: "ɪ", IY: "i", JH: "dʒ", K: "k", L: "l", M: "m", N: "n", NG: "ŋ", OW: "oʊ", OY: "ɔɪ", P: "p", R: "r", S: "s", SH: "ʃ", T: "t", TH: "θ", UH: "ʊ", UW: "u", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ" };
const VOWEL = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)/;
function legalOnset(a, b) {
  if (a === "S" && /^(P|T|K|M|N|L|W|F)$/.test(b)) return true;
  if (/^(P|B|K|G|F|TH)$/.test(a) && /^(L|R)$/.test(b)) return true;
  if (/^(T|D|SH)$/.test(a) && b === "R") return true;
  if (/^(K|G|T|D|S|TH)$/.test(a) && b === "W") return true;
  return false;
}
export function arpaToIpa(phones) {
  if ((phones.match(/[012]/g) ?? []).length === 1) phones = phones.replace(/[12]/, "0").replace(/AH0/, "AH1");
  const ps = phones.split(" ");
  const out = [];
  for (let i = 0; i < ps.length; i++) {
    const m = ps[i].match(/^([A-Z]+)(\d)?$/);
    if (!m) continue;
    let [, ph, st] = m;
    let sym = ARPA[ph] ?? "";
    if (ph === "AH" && st === "0") sym = "ə";
    if (ph === "ER" && st === "0") sym = "ɚ";
    if (st === "1" || st === "2") {
      // put stress mark before the syllable onset (preceding consonants, max 2)
      let j = out.length;
      const c1 = ps[i - 1] && !VOWEL.test(ps[i - 1]) ? ps[i - 1] : null;
      const c2 = c1 && ps[i - 2] && !VOWEL.test(ps[i - 2]) ? ps[i - 2] : null;
      if (c1) j--;
      if (c1 && c2 && legalOnset(c2, c1)) {
        j--;
        if (ps[i - 3] === "S" && /^(P|T|K)$/.test(c2)) j--;
      }
      if (ps.filter((x) => /\d/.test(x)).length > 1) out.splice(Math.max(0, j), 0, st === "1" ? "ˈ" : "ˌ");
    }
    out.push(sym);
  }
  return out.join("");
}
