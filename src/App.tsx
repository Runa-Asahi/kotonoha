import { lazy, Suspense, useEffect } from "react";
import { Link, Route, Router, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useStore } from "./store";
import Home from "./pages/Home";
const Study = lazy(() => import("./pages/Study"));
const Spell = lazy(() => import("./pages/Spell"));
const Words = lazy(() => import("./pages/Words"));
const WordDetail = lazy(() => import("./pages/WordDetail"));
const Stats = lazy(() => import("./pages/Stats"));
const SettingsPage = lazy(() => import("./pages/Settings"));

const tabs = [
  { to: "/", label: "今日", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { to: "/words", label: "词库", icon: "M4 5h12a4 4 0 014 4v10H8a4 4 0 01-4-4zM8 9h8M8 13h6" },
  { to: "/stats", label: "统计", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { to: "/settings", label: "设置", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 3h-5l-.3 2.6a7 7 0 00-1.7 1l-2.4-1-2 3.4L5.1 11a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.3 2.6h5l.3-2.6a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1z" },
];

function Nav() {
  const [loc] = useLocation();
  if (loc === "/study" || loc === "/spell") return null;
  return (
    <nav aria-label="主导航" className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <ul className="mx-auto flex max-w-xl">
        {tabs.map((t) => {
          const active = t.to === "/" ? loc === "/" : loc.startsWith(t.to);
          return (
            <li key={t.to} className="flex-1">
              <Link href={t.to} aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${active ? "text-brand-600 dark:text-brand-500" : "text-slate-500"}`}>
                <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NotFound() {
  return (
    <div className="card mt-10 p-8 text-center">
      <p className="text-4xl">🧭</p>
      <h1 className="mt-3 text-lg font-semibold">页面不存在</h1>
      <Link href="/" className="btn-primary mt-6">回到今日</Link>
    </div>
  );
}

function useTheme() {
  const dark = useStore((s) => s.settings.dark);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", dark === "dark" || (dark === "auto" && mq.matches));
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [dark]);
}

export default function App() {
  useTheme();
  return (
    <Router hook={useHashLocation}>
      <main className="mx-auto min-h-dvh max-w-xl px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
        <Suspense fallback={<p role="status" className="mt-16 text-center text-slate-500">加载中…</p>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/study" component={Study} />
          <Route path="/spell" component={Spell} />
          <Route path="/words" component={Words} />
          <Route path="/words/:id" component={WordDetail} />
          <Route path="/stats" component={Stats} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </main>
      <Nav />
    </Router>
  );
}
