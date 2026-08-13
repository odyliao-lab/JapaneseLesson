# 日語推理研究所

「日語推理研究所／謎解き日本語ラボ」是為零基礎國中生設計的互動日語學習網站。課程以原創推理社團任務包裝，規劃 60 天、每天 45–60 分鐘的循序學習。

## 第一版內容

- 新人搜查員 24 天：假名、發音、招呼、助詞與 `です／ます`
- 線索分析官 20 天：動詞、て形、形容詞、量詞與生活情境
- 真相報告員 16 天：普通形、引用、條件句、漢字與短篇閱讀
- 每課七步學習流程、10 個核心詞彙、文法、雙速聽力、跟讀錄音、15 分鐘自習與五題測驗
- 日語語音播放、羅馬拼音開關、匿名裝置進度、XP 與階段徽章
- Day 1–12 紙筆五十音學習：逐筆動畫、語音聽寫、自我檢查、錯字複習與 A4 練習單
- 選用登入、雲端進度同步、班級邀請碼與學生作業提交
- 教師即時報告、學生轉班／移除、作業批改與通知
- 學生主動授權的家長連結與家庭學習報告
- JLPT N5→N4 對照、CSV／PDF 匯出與課程內容管理後台
- iPad 橫向優先，兼顧桌面與手機

所有城市、角色與案件皆為原創設定，不使用任何既有動漫作品的角色、標誌、故事或代表性道具。

五十音筆順路徑取自 [KanjiVG](https://kanjivg.tagaini.net/)（Ulrich Apel 與貢獻者），依 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) 授權使用。路徑幾何未修改，衍生的筆順資料檔維持相同授權。

## 開發

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
npm run build
npm test
```

資料庫結構位於 `db/schema.ts`，Drizzle migration 位於 `drizzle/`。

## 本機完整部署

本機版沿用 Worker 執行環境，使用 Wrangler/Miniflare 的本機 D1 SQLite，並提供電子郵件與密碼登入。正式資料不會寫回 Sites D1。

```powershell
npm ci
npm run local:build
npm run local:start
```

預設服務位於 `http://127.0.0.1:3101/japanese`，資料存放於 `%USERPROFILE%\JapaneseLesson-Local\data`。可用以下指令檢查服務與備份資料庫：

```powershell
npm run local:health
npm run local:backup
```

`scripts/install-local-tasks.ps1` 會建立登入時啟動的 `JapaneseLesson-Local`，以及每天 03:00 執行的 `JapaneseLesson-Backup`；備份保留最近 30 份。公開連線可由 Cloudflare Tunnel 將既有 hostname 的 `/japanese` 路徑轉送至 `http://localhost:3101`。
