import { useEffect } from "react";
import { useStore } from "../store";

export type Season = "spring" | "summer" | "autumn" | "winter";
export const SEASONS: Record<Season, { label: string; kigo: string }> = {
  spring: { label: "春", kigo: "桜" },
  summer: { label: "夏", kigo: "青竹" },
  autumn: { label: "秋", kigo: "紅葉" },
  winter: { label: "冬", kigo: "藍" },
};
export function seasonOf(d = new Date()): Season {
  const m = d.getMonth() + 1;
  return m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
}

export function useTheme() {
  const dark = useStore((s) => s.settings.dark);
  const season = useStore((s) => s.settings.season);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.season = season === "auto" ? seasonOf() : season;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const on = dark === "dark" || (dark === "auto" && mq.matches);
      root.classList.toggle("dark", on);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", on ? "#101214" : "#f2ede3");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [dark, season]);
}
