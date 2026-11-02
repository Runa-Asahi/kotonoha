/**
 * Pronunciation with layered fallbacks:
 *  1. bundled audio (all kana — works offline and inside the APK, no system TTS needed)
 *  2. Youdao dictionary audio (real human/neural recordings, online, EN US/UK + JA)
 *  3. Web Speech API (system TTS) — many Android WebViews ship without a ja-JP voice,
 *     which is why v2.1 "听音" was silent there.
 * One shared <audio> element is reused so the first user tap unlocks playback for the session.
 */
import { haptic } from "./haptics";

type Lang = "en" | "ja";
export type Accent = "us" | "uk";

let audio: HTMLAudioElement | null = null;
let token = 0;
const failed = new Set<string>();
const listeners = new Set<(ok: boolean) => void>();
export const onSpeakResult = (fn: (ok: boolean) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
const report = (ok: boolean) => listeners.forEach((l) => l(ok));

function el() {
  if (!audio && typeof Audio !== "undefined") {
    audio = new Audio();
    audio.preload = "auto";
  }
  return audio;
}

function playUrl(url: string, timeout = 2500): Promise<boolean> {
  const a = el();
  if (!a || failed.has(url)) return Promise.resolve(false);
  const my = ++token;
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(t);
      a.removeEventListener("playing", onOk);
      a.removeEventListener("error", onErr);
      if (!ok) failed.add(url);
      resolve(ok);
    };
    const onOk = () => finish(true);
    const onErr = () => finish(false);
    const t = setTimeout(() => finish(false), timeout);
    a.addEventListener("playing", onOk);
    a.addEventListener("error", onErr);
    a.src = url;
    a.currentTime = 0;
    a.play().catch(() => my === token && finish(false));
  });
}

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;
function voices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof speechSynthesis === "undefined") return Promise.resolve([]);
  if (!voicesReady)
    voicesReady = new Promise((res) => {
      const v = speechSynthesis.getVoices();
      if (v.length) return res(v);
      const on = () => res(speechSynthesis.getVoices());
      speechSynthesis.addEventListener?.("voiceschanged", on, { once: true });
      setTimeout(on, 1200);
    });
  return voicesReady;
}
if (typeof speechSynthesis !== "undefined") voices();

const PREF: Record<string, RegExp> = { "en-US": /Samantha|Google|Natural|Aria|Jenny/i, "en-GB": /Daniel|Google|Natural|Sonia|Libby/i, "ja-JP": /Kyoko|Google|Nanami|Otoya|O-ren/i };

async function tts(text: string, lang: string, rate: number): Promise<boolean> {
  if (typeof speechSynthesis === "undefined") return false;
  const all = await voices();
  const base = lang.slice(0, 2);
  const v =
    all.find((x) => x.lang.replace("_", "-") === lang && PREF[lang]?.test(x.name)) ??
    all.find((x) => x.lang.replace("_", "-") === lang) ??
    all.find((x) => x.lang.startsWith(base));
  // No matching voice: the engine would read Japanese with an English voice (or stay silent).
  if (!v && all.length) return false;
  speechSynthesis.cancel();
  // Chrome drops an utterance queued in the same tick as cancel()
  await new Promise((r) => setTimeout(r, 30));
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  if (v) u.voice = v;
  speechSynthesis.speak(u);
  return true;
}

export const canSpeak = () => true;

const BASE = () => import.meta.env.BASE_URL;
const youdao = (text: string, lang: Lang, accent: Accent) =>
  `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${accent === "uk" ? 1 : 2}${lang === "ja" ? "&le=jap" : ""}`;

export function stopSpeaking() {
  token++;
  audio?.pause();
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

/** Play a single kana from the bundled recordings. */
export async function speakKana(hira: string) {
  const ok = (await playUrl(`${BASE()}audio/kana/${encodeURIComponent(hira)}.mp3`, 4000)) || (await tts(hira, "ja-JP", 0.8));
  report(ok);
  return ok;
}

/** Pronounce a word or sentence. Words try real recordings first; long sentences go straight to TTS. */
export async function speak(text: string, lang: Lang = "en", accent: Accent = "us") {
  if (!text) return false;
  haptic("light");
  const sentence = text.length > 24 || /\s.*\s/.test(text);
  const online = typeof navigator === "undefined" || navigator.onLine !== false;
  let ok = false;
  if (!sentence && online) ok = await playUrl(youdao(text, lang, accent));
  if (!ok) ok = await tts(text, lang === "ja" ? "ja-JP" : accent === "uk" ? "en-GB" : "en-US", lang === "ja" ? 0.85 : 0.9);
  if (!ok && sentence && online) ok = await playUrl(youdao(text, lang, accent), 4000);
  report(ok);
  return ok;
}
