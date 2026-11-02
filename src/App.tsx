import { lazy, Suspense, useEffect } from "react";
import { Link, Route, Router, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { BookText, ChartSpline, House, Languages } from "lucide-react";
import { useTheme } from "./lib/theme";
import { haptic } from "./lib/haptics";
import Home from "./pages/Home";

const Study = lazy(() => import("./pages/Study"));
const Spell = lazy(() => import("./pages/Spell"));
const Words = lazy(() => import("./pages/Words"));
const WordDetail = lazy(() => import("./pages/WordDetail"));
const Kana = lazy(() => import("./pages/Kana"));
const Stats = lazy(() => import("./pages/Stats"));
const SettingsPage = lazy(() => import("./pages/Settings"));

const tabs = [
  { to: "/", label: "今日", Icon: House },
  { to: "/words", label: "词库", Icon: BookText },
  { to: "/kana", label: "五十音", Icon: Languages },
  { to: "/stats", label: "曲线", Icon: ChartSpline },
];
const FULLSCREEN = ["/study", "/spell"];

function Nav() {
  const [loc] = useLocation();
  if (FULLSCREEN.includes(loc)) return null;
  return (
    <nav aria-label="主导航" className="tabbar fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur-md">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map(({ to, label, Icon }) => {
          const active = to === "/" ? loc === "/" : loc.startsWith(to);
          return (
            <li key={to}>
              <Link href={to} aria-current={active ? "page" : undefined} onClick={() => haptic("light")}
                className={`press relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${active ? "text-fg" : "text-subtle"}`}>
                <span aria-hidden className={`absolute top-0 h-0.5 w-8 rounded-full bg-accent transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`} />
                <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.6} />
                {label}
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
    <div className="card mt-16 p-8 text-center">
      <p className="font-jp text-5xl">迷</p>
      <h1 className="mt-3 text-lg font-medium">这一页不存在</h1>
      <Link href="/" className="btn-ink mt-6 w-full">回到今日</Link>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  const [loc] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc]);
  return <div key={loc} className="animate-[rise_.32s_var(--ease-out-soft)_both]">{children}</div>;
}

export default function App() {
  useTheme();
  return (
    <Router hook={useHashLocation}>
      <main className="safe-top mx-auto min-h-dvh max-w-lg px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <Suspense fallback={<div className="pt-24 text-center text-sm text-subtle" role="status">…</div>}>
          <Page>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/study" component={Study} />
              <Route path="/spell" component={Spell} />
              <Route path="/words" component={Words} />
              <Route path="/words/:id" component={WordDetail} />
              <Route path="/kana" component={Kana} />
              <Route path="/stats" component={Stats} />
              <Route path="/settings" component={SettingsPage} />
              <Route component={NotFound} />
            </Switch>
          </Page>
        </Suspense>
      </main>
      <Nav />
    </Router>
  );
}
