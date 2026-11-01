# 言叶 Kotonoha · 新托福单词

在线使用：**https://runa-asahi.github.io/kotonoha/** （手机浏览器打开后「添加到主屏幕」即可像 App 一样离线使用）

参考墨墨背单词的学习方式，用现代记忆算法背新托福词汇。

## 功能

- **新托福词库**：10,366 词，含词性释义与常用短语。
- **FSRS 智能复习**：业界最新的间隔重复算法（Anki 同款），在你快要忘记时安排复习；可调目标记忆保持率。
- **每日任务**：每日新词 + 到期复习，复习与新词交替出现；凌晨 4 点切换学习日。
- **先回忆再看答案**：认识 / 模糊 / 忘记，看答案后可「记错了」纠正；「忘记」的词本轮稍后会再出现；「太简单」的词不再出现；支持撤销。
- **拼写练习**：根据中文释义拼写，优先练最薄弱的词，带字母提示。
- **发音**：浏览器内置语音朗读（可设置自动朗读）。
- **统计**：连续打卡、学习热力图、记忆阶段、未来 7 天复习预测、正确率。
- **词库浏览**：搜索英文/中文，按学习中/未学/收藏/已掌握筛选。
- **离线 PWA**、深色模式、移动端优先、键盘快捷键（1/2/3 选择，空格下一个，R 朗读）。
- 数据保存在本机浏览器，可导出 / 导入备份。

## 技术栈

Vite 8 · React 19 · TypeScript · Tailwind CSS 4 · ts-fsrs · zustand（localStorage 持久化）· wouter（hash 路由）· vite-plugin-pwa · Vitest · GitHub Actions → GitHub Pages。

纯静态站点，无需服务器、数据库或登录。

## 开发

```bash
npm install
npm run dev       # 本地开发
npm test          # 单元测试
npm run lint
npm run build     # 产物在 dist/
npm run words     # 重新生成 public/words/toefl.json
```

推送到 `main` 后 GitHub Actions 自动构建并部署到 Pages（仓库 Settings → Pages → Source 选 “GitHub Actions”）。

## 词库来源

[KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary) 的「托福」词表，BSD-3-Clause 许可。见 `public/words/LICENSE`。
