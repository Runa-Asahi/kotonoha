import { useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { exportData, useStore, type Settings } from "../store";
import { SEASONS, seasonOf } from "../lib/theme";
import { Sheet } from "../components/Sheet";

function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="mt-2 flex flex-wrap gap-1.5">
      {options.map(([v, l]) => (
        <button key={String(v)} role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`press min-h-10 min-w-12 rounded-xl border px-3 text-sm ${value === v ? "border-transparent bg-ink text-ink-fg" : "border-border text-muted"}`}>{l}</button>
      ))}
    </div>
  );
}
function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <div className="border-b border-border py-4 last:border-0"><p className="text-sm">{title}</p>{hint && <p className="text-xs text-subtle">{hint}</p>}{children}</div>;
}

export default function SettingsPage() {
  const s = useStore();
  const st = s.settings;
  const set = (p: Partial<Settings>) => s.setSettings(p);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState(false);
  const now = SEASONS[seasonOf()];

  const doExport = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kotonoha-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = async (f: File) => {
    try { s.importData(await f.text()); setMsg("已导入备份"); } catch (e) { setMsg(`导入失败：${(e as Error).message}`); }
  };

  return (
    <div className="pt-1">
      <button onClick={() => history.back()} className="press -ml-2 inline-flex h-11 items-center gap-0.5 pr-2 text-sm text-muted"><ChevronLeft className="size-4" />返回</button>
      <h1 className="font-jp text-[32px] leading-tight">设置</h1>
      <p className="mt-1 text-sm text-muted">进度只保存在这台设备上。到期的复习不受每日新词数量限制。</p>

      <section className="card mt-5 px-4">
        <Row title="每日新词"><Seg label="每日新词" value={st.dailyNew} onChange={(v) => set({ dailyNew: v })} options={[5, 10, 20, 30, 50, 100].map((n) => [n, String(n)] as [number, string])} /></Row>
        <Row title="每日复习上限"><Seg label="每日复习上限" value={st.reviewLimit} onChange={(v) => set({ reviewLimit: v })} options={[[100, "100"], [200, "200"], [500, "500"], [9999, "不限"]]} /></Row>
        <Row title="目标记忆率" hint="越高复习越频繁；90% 是多数人的最佳平衡"><Seg label="目标记忆率" value={st.retention} onChange={(v) => set({ retention: v })} options={[[0.85, "85%"], [0.9, "90%"], [0.93, "93%"], [0.95, "95%"]]} /></Row>
        <Row title="英语发音"><Seg label="英语发音" value={st.accent} onChange={(v) => set({ accent: v })} options={[["us", "美式"], ["uk", "英式"]]} /></Row>
        <Row title="出现新卡片时自动朗读"><Seg label="自动朗读" value={st.autoSpeak ? "on" : "off"} onChange={(v) => set({ autoSpeak: v === "on" })} options={[["on", "开"], ["off", "关"]]} /></Row>
      </section>

      <section className="card mt-4 px-4">
        <Row title="外观" hint="和紙 = 米色纸面，墨 = 1.0 的深色墨面"><Seg label="外观" value={st.dark} onChange={(v) => set({ dark: v })} options={[["auto", "跟随系统"], ["light", "和紙"], ["dark", "墨"]]} /></Row>
        <Row title="季节色" hint={`自动跟随季节，现在是 ${now.label}・${now.kigo}`}>
          <Seg label="季节色" value={st.season} onChange={(v) => set({ season: v })} options={[["auto", "自动"], ["spring", "春 桜"], ["summer", "夏 青竹"], ["autumn", "秋 紅葉"], ["winter", "冬 藍"]]} />
        </Row>
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <p className="text-sm">数据</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-line" onClick={doExport}>导出备份</button>
          <button className="btn-line" onClick={() => file.current?.click()}>导入备份</button>
        </div>
        <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        <button className="btn w-full text-again" onClick={() => setConfirm(true)}>重置学习记录</button>
        {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
      </section>

      <p className="mt-6 px-2 pb-4 text-center text-[11px] leading-relaxed text-subtle">
        言叶 v{__APP_VERSION__} · FSRS 复习算法<br />
        英语词库 KyleBing/english-vocabulary（BSD-3）· 音标 CMUdict（美）/ ECDICT（英）<br />
        日语词库 open-anki-jlpt-decks（MIT）· 真人发音来自有道词典，离线时使用系统语音
      </p>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="重置学习记录？">
        <p className="text-sm text-muted">会清除这台设备上的所有复习记录，词库本身还在。建议先导出备份。</p>
        <div className="mt-5 grid grid-cols-2 gap-2 pb-2">
          <button className="btn-line text-again" onClick={() => { s.reset(); setConfirm(false); setMsg("已清除"); }}>清除记录</button>
          <button className="btn-ink" onClick={() => setConfirm(false)}>留下</button>
        </div>
      </Sheet>
    </div>
  );
}
