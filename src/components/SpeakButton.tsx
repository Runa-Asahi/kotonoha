import { canSpeak, speak } from "../lib/speech";

export function SpeakButton({ text, lang = "en", className = "", label }: { text: string; lang?: "en" | "ja"; className?: string; label?: string }) {
  if (!canSpeak()) return null;
  return (
    <button type="button" aria-label={label ?? `朗读 ${text}`} onClick={(e) => { e.stopPropagation(); speak(text, lang); }}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 ${className}`}>
      <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14" /></svg>
    </button>
  );
}
