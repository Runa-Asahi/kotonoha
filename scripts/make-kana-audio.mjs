// Generates public/audio/kana/<romaji>.mp3 for every kana with edge-tts (ja-JP-NanamiNeural),
// trimmed and re-encoded small. Requires `edge-tts` (pip) and ffmpeg. Run: node scripts/make-kana-audio.mjs [edge-tts-bin]
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { GOJUON, VOICED, YOON } from "../src/data/kana.ts";

const bin = process.argv[2] || "edge-tts";
mkdirSync("public/audio/kana", { recursive: true });
const all = [...GOJUON, ...VOICED, ...YOON.flat()];
for (const k of all) {
  const out = `public/audio/kana/${k.hira}.mp3`;
  if (existsSync(out)) continue;
  execFileSync(bin, ["--voice", "ja-JP-NanamiNeural", "--rate=-15%", "--text", k.hira, "--write-media", "/tmp/kana.mp3"]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", "/tmp/kana.mp3", "-af",
    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.05",
    "-ac", "1", "-ar", "24000", "-b:a", "40k", out]);
  process.stdout.write(k.hira);
}
console.log(`\n${all.length} kana`);
