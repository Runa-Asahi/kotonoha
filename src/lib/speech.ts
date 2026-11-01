const voices: Partial<Record<string, SpeechSynthesisVoice | null>> = {};
const PREF: Record<string, RegExp> = { "en-US": /Samantha|Google|Natural|Aria|Jenny/i, "ja-JP": /Kyoko|Google|Nanami|Otoya|O-ren/i };

function pickVoice(lang: string) {
  if (typeof speechSynthesis === "undefined") return null;
  const all = speechSynthesis.getVoices();
  const base = lang.slice(0, 2);
  const v =
    all.find((x) => x.lang.replace("_", "-") === lang && PREF[lang]?.test(x.name)) ??
    all.find((x) => x.lang.replace("_", "-") === lang) ??
    all.find((x) => x.lang.startsWith(base)) ??
    null;
  if (all.length) voices[lang] = v;
  return v;
}
if (typeof speechSynthesis !== "undefined")
  speechSynthesis.addEventListener?.("voiceschanged", () => {
    for (const k of Object.keys(voices)) delete voices[k];
  });

export const canSpeak = () => typeof speechSynthesis !== "undefined";

export function speak(text: string, lang: "en" | "ja" | "en-US" | "ja-JP" = "en", rate?: number) {
  if (!canSpeak()) return;
  const l = lang === "ja" ? "ja-JP" : lang === "en" ? "en-US" : lang;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = l;
  u.rate = rate ?? (l === "ja-JP" ? 0.85 : 0.9);
  const v = voices[l] ?? pickVoice(l);
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
