let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  voice =
    voices.find((v) => v.lang === "en-US" && /Samantha|Google|Natural|Aria|Jenny/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;
  return voice;
}
if (typeof speechSynthesis !== "undefined") speechSynthesis.addEventListener?.("voiceschanged", pickVoice);

export const canSpeak = () => typeof speechSynthesis !== "undefined";

export function speak(text: string, rate = 0.9) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const v = voice ?? pickVoice();
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
