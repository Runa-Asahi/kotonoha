export type Rating = "again" | "hard" | "good" | "easy";

/** Index is the memory stage. Stage 0 is a lapse; 1–10 follow Ebbinghaus checkpoints. */
const MINUTES = [
  1,
  5,
  30,
  12 * 60,
  24 * 60,
  2 * 24 * 60,
  4 * 24 * 60,
  7 * 24 * 60,
  15 * 24 * 60,
  30 * 24 * 60,
  60 * 24 * 60,
];

export const STAGE_LABEL = [
  "待巩固",
  "5 分钟",
  "30 分钟",
  "12 小时",
  "1 天",
  "2 天",
  "4 天",
  "7 天",
  "15 天",
  "30 天",
  "60 天",
] as const;

export const RATING_LABEL: Record<Rating, string> = {
  again: "忘记",
  hard: "生疏",
  good: "记住",
  easy: "很容易",
};

export const LADDER = STAGE_LABEL.slice(1);

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} 分钟`;
  const days = mins / (60 * 24);
  if (days >= 1) {
    const rounded = Math.round(days * 10) / 10;
    if (Math.abs(rounded - Math.round(rounded)) < 0.05) return `${Math.round(rounded)} 天`;
    return `${rounded} 天`;
  }
  return `${Math.round(mins / 60)} 小时`;
}

export function nextStep(stage: number, rating: Rating): { stage: number; minutes: number } {
  if (rating === "again") return { stage: 0, minutes: MINUTES[0] };
  if (rating === "hard") {
    const stay = Math.max(1, stage);
    return { stage: stay, minutes: Math.max(5, Math.round(MINUTES[stay] / 2)) };
  }
  const jump = rating === "easy" ? 2 : 1;
  const next = Math.min(MINUTES.length - 1, stage + jump);
  return { stage: next, minutes: MINUTES[next] };
}

export function ratingsFor(stage: number): Rating[] {
  if (stage <= 0) return ["again", "good", "easy"];
  return ["again", "hard", "good", "easy"];
}

export function dayKey(ts = Date.now()): string {
  const date = new Date(ts);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function shiftDay(key: string, delta: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  return dayKey(date.getTime());
}
