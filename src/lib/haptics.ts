import { Capacitor } from "@capacitor/core";

type Kind = "light" | "medium" | "success" | "error";
let mod: typeof import("@capacitor/haptics") | null = null;
if (Capacitor.isNativePlatform()) import("@capacitor/haptics").then((m) => (mod = m));

export function haptic(kind: Kind = "light") {
  try {
    if (mod) {
      const { Haptics, ImpactStyle, NotificationType } = mod;
      if (kind === "success") Haptics.notification({ type: NotificationType.Success });
      else if (kind === "error") Haptics.notification({ type: NotificationType.Error });
      else Haptics.impact({ style: kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
    } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(kind === "error" ? [12, 40, 12] : kind === "success" ? 18 : kind === "medium" ? 12 : 6);
    }
  } catch {
    /* haptics are best-effort */
  }
}
