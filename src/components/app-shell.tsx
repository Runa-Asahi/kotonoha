import { BookOpen, House, Languages, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CurveView } from "@/components/curve-view";
import { HomeView } from "@/components/home-view";
import { KanaView } from "@/components/kana-view";
import { LexiconView } from "@/components/lexicon-view";
import { StudyView, type StudyPhase } from "@/components/study-view";
import { cn } from "@/lib/cn";
import { primeVoices } from "@/lib/speak";
import { useMemory } from "@/lib/store";

type Tab = "home" | "study" | "kana" | "curve" | "lexicon";

const TABS: { id: Exclude<Tab, "lexicon">; label: string; icon: typeof House }[] = [
  { id: "home", label: "今日", icon: House },
  { id: "study", label: "学习", icon: BookOpen },
  { id: "kana", label: "五十音", icon: Languages },
  { id: "curve", label: "曲线", icon: TrendingDown },
];

export function AppShell() {
  const [tab, setTab] = useState<Tab>("home");
  const [opened, setOpened] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [phase, setPhase] = useState<StudyPhase | "idle">("idle");
  const addExtra = useMemory((state) => state.addExtra);

  useEffect(() => {
    void useMemory.persist.rehydrate();
    primeVoices();
  }, []);

  const onPhase = useCallback((next: StudyPhase) => {
    setPhase((current) => (current === next ? current : next));
  }, []);

  function openStudy(fresh: boolean) {
    if (fresh || !opened || phase !== "run") {
      setNonce((value) => value + 1);
      setOpened(true);
      setPhase("idle");
    }
    setTab("study");
  }

  const running = phase === "run";

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto min-h-dvh w-full max-w-lg">
        <main className="app-pad">
          {tab === "home" ? (
            <div className="rise">
              <HomeView
                running={running}
                onStudy={() => openStudy(false)}
                onMore={() => {
                  addExtra(10);
                  openStudy(true);
                }}
                onLexicon={() => setTab("lexicon")}
              />
            </div>
          ) : null}
          {tab === "kana" ? (
            <div className="rise">
              <KanaView />
            </div>
          ) : null}
          {tab === "curve" ? (
            <div className="rise">
              <CurveView />
            </div>
          ) : null}
          {tab === "lexicon" ? (
            <div className="rise">
              <LexiconView onBack={() => setTab("home")} />
            </div>
          ) : null}
          {opened ? (
            <div className={tab === "study" ? "rise" : "hidden"}>
              <StudyView key={nonce} onExit={() => setTab("home")} onPhase={onPhase} />
            </div>
          ) : null}
        </main>
        <nav aria-label="主导航" className="tabbar fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg">
          <div className="mx-auto grid w-full max-w-lg grid-cols-4">
            {TABS.map((item) => {
              const active = tab === item.id || (item.id === "home" && tab === "lexicon");
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    if (item.id === "study") openStudy(false);
                    else setTab(item.id);
                  }}
                  className={cn(
                    "press flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 text-xs",
                    active ? "border-accent text-fg" : "border-transparent text-subtle",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
