import { useRef, useState } from "react";
import { exportData, useStore } from "../store";

export default function SettingsPage() {
  const s = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const st = s.settings;

  const doExport = () => {
    const url = URL.createObjectURL(new Blob([exportData()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kotonoha-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = async (f: File) => {
    try { s.importData(await f.text()); setMsg("导入成功"); } catch (e) { setMsg(`导入失败：${(e as Error).message}`); }
  };

  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold">设置</h1>
      <section className="card divide-y divide-slate-100 dark:divide-slate-800">
        <label className="flex items-center justify-between p-4">
          <span>每日新词<span className="block text-xs text-slate-500">建议 10–30 个</span></span>
          <select value={st.dailyNew} onChange={(e) => s.setSettings({ dailyNew: +e.target.value })} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
            {[5, 10, 15, 20, 30, 40, 50, 80, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between p-4">
          <span>每日复习上限</span>
          <select value={st.reviewLimit} onChange={(e) => s.setSettings({ reviewLimit: +e.target.value })} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
            {[50, 100, 200, 300, 500, 9999].map((n) => <option key={n} value={n}>{n === 9999 ? "不限" : n}</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between p-4">
          <span>目标记忆保持率<span className="block text-xs text-slate-500">越高复习越频繁</span></span>
          <select value={st.retention} onChange={(e) => s.setSettings({ retention: +e.target.value })} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
            {[0.8, 0.85, 0.9, 0.93, 0.95].map((n) => <option key={n} value={n}>{Math.round(n * 100)}%</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between p-4">
          <span>自动朗读发音</span>
          <input type="checkbox" checked={st.autoSpeak} onChange={(e) => s.setSettings({ autoSpeak: e.target.checked })} className="h-6 w-6 accent-brand-600" />
        </label>
        <label className="flex items-center justify-between p-4">
          <span>外观</span>
          <select value={st.dark} onChange={(e) => s.setSettings({ dark: e.target.value as "auto" })} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
            <option value="auto">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option>
          </select>
        </label>
      </section>
      <section className="card space-y-3 p-4">
        <h2 className="font-medium">数据</h2>
        <p className="text-xs text-slate-500">学习记录只保存在本设备浏览器中。换设备前请先导出备份。</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={doExport}>导出备份</button>
          <button className="btn-ghost" onClick={() => file.current?.click()}>导入备份</button>
        </div>
        <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        <button className="btn w-full text-rose-600" onClick={() => confirm("确定清空所有学习记录？此操作不可撤销。") && s.reset()}>清空学习记录</button>
        {msg && <p role="status" className="text-sm">{msg}</p>}
      </section>
      <p className="px-2 text-center text-xs leading-relaxed text-slate-400">
        言叶 v{__APP_VERSION__} · 复习算法 FSRS · 英语词库 <a className="underline" href="https://github.com/KyleBing/english-vocabulary" target="_blank" rel="noreferrer">KyleBing/english-vocabulary</a>（BSD-3-Clause）· 日语词库 <a className="underline" href="https://github.com/jamsinclair/open-anki-jlpt-decks" target="_blank" rel="noreferrer">open-anki-jlpt-decks</a>（MIT）
      </p>
    </div>
  );
}
