export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function primeVoices(): void {
  if (!canSpeak()) return;
  window.speechSynthesis.getVoices();
}

export function speak(text: string, lang: "en-US" | "ja-JP"): boolean {
  if (!canSpeak()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = lang === "ja-JP" ? 0.9 : 0.92;
  const prefix = lang.slice(0, 2).toLowerCase();
  const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith(prefix));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
  return true;
}
