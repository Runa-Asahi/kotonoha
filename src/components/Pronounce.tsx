import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { onSpeakResult, speak, type Accent } from "../lib/speech";
import type { Word } from "../lib/words";
import { useStore } from "../store";

export function SpeakButton({ text, lang, accent, label, size = "md" }: { text: string; lang: "en" | "ja"; accent?: Accent; label?: string; size?: "sm" | "md" }) {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" aria-label={label ?? `朗读 ${text}`}
      onClick={async (e) => { e.stopPropagation(); setBusy(true); await speak(text, lang, accent); setTimeout(() => setBusy(false), 500); }}
      className={`press grid shrink-0 place-items-center rounded-full border border-border bg-surface text-fg ${size === "sm" ? "size-8" : "size-11"} ${busy ? "text-accent" : ""}`}>
      <Volume2 className={size === "sm" ? "size-4" : "size-5"} strokeWidth={1.8} />
    </button>
  );
}

/** IPA (US / UK) for English, kana + romaji for Japanese, each with its own play button. */
export function Pronounce({ w, lang, showReading = true }: { w: Word; lang: "en" | "ja"; showReading?: boolean }) {
  const pref = useStore((s) => s.settings.accent);
  const [silent, setSilent] = useState(false);
  useEffect(() => onSpeakResult((ok) => setSilent(!ok)), []);
  const say = lang === "ja" ? w.reading || w.word : w.word;
  return (
    <div className="mt-3">
      {lang === "en" ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          {(pref === "uk" ? (["uk", "us"] as const) : (["us", "uk"] as const)).map((a) => {
            const ipa = a === "us" ? w.ipaUS : w.ipaUK;
            if (!ipa && a !== pref) return null;
            return (
              <span key={a} className="inline-flex items-center gap-1.5">
                <span className="text-[10px] tracking-widest text-subtle">{a === "us" ? "美" : "英"}</span>
                <span className="font-word italic">/{ipa || "—"}/</span>
                <SpeakButton text={w.word} lang="en" accent={a} size="sm" label={`${a === "us" ? "美式" : "英式"}发音`} />
              </span>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {showReading && (
            <p className="text-sm text-muted">
              {w.reading && <span lang="ja" className="font-jp text-base text-fg">{w.reading}</span>}
              {w.romaji && <span className="ml-2 font-word italic">{w.romaji}</span>}
            </p>
          )}
          <SpeakButton text={say} lang="ja" size="sm" label="日语发音" />
        </div>
      )}
      {silent && <p className="mt-1 text-xs text-subtle">这台设备暂时放不出声音（离线且无系统语音），可以先看音标。</p>}
    </div>
  );
}
