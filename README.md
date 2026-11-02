# 言叶 Kotonoha · 英语 & 日语单词

在线使用：**https://runa-asahi.github.io/kotonoha/** （手机浏览器打开后「添加到主屏幕」即可像 App 一样离线使用）

参考墨墨背单词的学习方式，用 FSRS 记忆算法背英语和日语单词，并学习五十音。

## 安装 Android 版

到 [Releases](https://github.com/Runa-Asahi/kotonoha/releases) 下载最新的 `kotonoha-x.y.z.apk`，在手机上打开安装（需允许安装未知应用，Android 7+）。

## v2.2 设计

- 沿用 1.0.0 的墨色菱形标志与「ことのは」字标；两套主题：**和紙**（米色纸纹）与 **墨**（1.0 深色），强调色随季节变化（春桜 / 夏青竹 / 秋紅葉 / 冬藍）。
- 明朝体标题（内置 Noto Serif JP 子集）+ Newsreader 英文字体；卡片滑动、底部抽屉、印章动画与触感反馈（Android 震动）。
- 英语词条显示美式 / 英式音标（CMUdict / ECDICT），日语显示假名与罗马音；单词发音优先使用有道词典真人发音，离线时退回系统语音；五十音全部内置录音，离线和 APK 中都能听。

## 功能

- **7 本词书，进度和每日任务各自独立**：
  | 词书 | 词数 | 来源 |
  |---|---|---|
  | 新托福 | 10,366 | KyleBing/english-vocabulary |
  | 六级 CET-6 | 3,995 | KyleBing/english-vocabulary |
  | JLPT N5 | 710 | open-anki-jlpt-decks |
  | JLPT N4 | 666 | open-anki-jlpt-decks |
  | JLPT N3 | 2,111 | open-anki-jlpt-decks |
  | JLPT N2 | 1,912 | open-anki-jlpt-decks |
  | JLPT N1 | 2,700 | open-anki-jlpt-decks |

  英语词条带中文释义和常用短语；日语词条带假名读音和英文释义；v1 精编词条（中文释义、词根/汉字拆解、记忆钩子、例句）保留并置顶。
- **五十音**：平假名/片假名切换、清音/浊音/半浊音/拗音表、日语发音、口型与字形记忆提示、假名小测（看假名选读音 / 听音选假名，常错的假名更常出现）。
- **FSRS 智能复习**：业界最新的间隔重复算法（Anki 同款），在你快要忘记时安排复习；可调目标记忆保持率。
- **每日任务**：每日新词 + 到期复习，复习与新词交替出现；凌晨 4 点切换学习日。
- **先回忆再看答案**：认识 / 模糊 / 忘记，看答案后可「记错了」纠正；「忘记」的词本轮稍后会再出现；「太简单」的词不再出现；支持撤销。
- **拼写练习**：英语按释义拼写单词；日语看汉字写假名读音。优先练最薄弱的词，带提示。
- **发音**：系统语音朗读英语（en-US）和日语（ja-JP），可自动朗读。
- **统计**：连续打卡、学习热力图、记忆阶段、未来 7 天复习预测、正确率。
- **词库浏览**：搜索英文/中文，按学习中/未学/收藏/已掌握筛选。
- **离线 PWA**、深色模式、移动端优先、键盘快捷键（1/2/3 选择，空格下一个，R 朗读）。
- 数据保存在本机浏览器，可导出 / 导入备份。

## 技术栈

Vite 8 · React 19 · Capacitor 8（Android） · TypeScript · Tailwind CSS 4 · ts-fsrs · zustand（localStorage 持久化）· wouter（hash 路由）· vite-plugin-pwa · Vitest · GitHub Actions → GitHub Pages。

纯静态站点，无需服务器、数据库或登录。

## 开发

```bash
npm install
npm run dev       # 本地开发
npm test          # 单元测试
npm run lint
npm run build     # 产物在 dist/
npm run words     # 重新生成 public/words/*.json
npm run android:apk  # 构建 Android debug APK（需 JDK 21 + Android SDK）
```

推送到 `main` 后 GitHub Actions 自动构建并部署到 Pages（仓库 Settings → Pages → Source 选 “GitHub Actions”）。

## 词库来源

- 英语：[KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary)（BSD-3-Clause）
- 音标：[CMUdict](https://github.com/cmusphinx/cmudict)（BSD 风格许可，美式，ARPAbet→IPA 转换）、[ECDICT](https://github.com/skywind3000/ECDICT)（MIT，英式 + 词形变化）
- 五十音录音：`scripts/make-kana-audio.mjs` 用 edge-tts（ja-JP-NanamiNeural）离线生成
- 明朝字体：Noto Serif CJK JP 子集（SIL OFL 1.1），`scripts/make-font.sh`
- 日语：[jamsinclair/open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks)（MIT，源自 tanos.co.uk Jonathan Waller 的 JLPT 词表）

详见 `public/words/LICENSE`。GitHub Actions 的 Android APK 工作流会构建可直接安装的 debug 签名 APK。
