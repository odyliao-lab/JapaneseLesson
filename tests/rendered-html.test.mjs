import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("contains the complete learning headquarters", async () => {
  const [page, client, layout, curriculum] = await Promise.all([
    source("app/page.tsx"),
    source("app/components/LearningApp.tsx"),
    source("app/layout.tsx"),
    source("app/data/curriculum.ts"),
  ]);

  assert.match(page, /<LearningApp user=\{user\}/);
  assert.match(client, /日語推理研究所/);
  assert.match(client, /60 天完整線索手冊/);
  assert.match(client, /speechSynthesis/);
  assert.match(client, /localStorage/);
  assert.match(client, /五題全部完成後才可結案/);
  assert.match(client, /獨立搜查/);
  assert.match(client, /匯出 CSV/);
  assert.match(curriculum, /新人搜查員結案/);
  assert.match(curriculum, /線索分析官結案/);
  assert.match(curriculum, /真相報告員最終結案/);
  assert.match(layout, /og\.png/);
  assert.doesNotMatch(page + client + layout, /codex-preview|react-loading-skeleton/);
});

test("contains classroom, family, assignments and durable reports", async () => {
  const [teacher, schema, progress, classes, assignments, family, submissions, content] = await Promise.all([
    source("app/components/TeacherDashboard.tsx"),
    source("db/schema.ts"),
    source("app/api/progress/route.ts"),
    source("app/api/classes/route.ts"),
    source("app/api/assignments/route.ts"),
    source("app/api/family/route.ts"),
    source("app/api/submissions/route.ts"),
    source("app/api/content/route.ts"),
  ]);

  assert.match(teacher, /班級搜查報告/);
  assert.match(teacher, /建立班級/);
  assert.match(schema, /sqliteTable\(\s*"progress"/);
  assert.match(schema, /sqliteTable\("classes"/);
  assert.match(schema, /sqliteTable\("assignments"/);
  assert.match(schema, /sqliteTable\(\s*"lesson_attempts"/);
  assert.match(schema, /sqliteTable\(\s*"guardian_links"/);
  assert.match(schema, /sqliteTable\("lesson_overrides"/);
  assert.match(progress, /getChatGPTUser/);
  assert.match(classes, /teacherEmail/);
  assert.match(assignments, /startDay/);
  assert.match(family, /familyInvites/);
  assert.match(submissions, /feedback/);
  assert.match(content, /adminEmails/);
});

test("contains the paper-first kana writing lab", async () => {
  const [lab, learningApp, schema, api, worksheet, strokeData] = await Promise.all([
    source("app/components/KanaWritingLab.tsx"),
    source("app/components/LearningApp.tsx"),
    source("db/schema.ts"),
    source("app/api/kana/route.ts"),
    source("app/worksheets/page.tsx"),
    source("app/data/kana-strokes.ts"),
  ]);

  assert.match(lab, /紙筆練習/);
  assert.match(lab, /隨機聽寫/);
  assert.match(lab, /寫得順/);
  assert.match(lab, /需要重練/);
  assert.doesNotMatch(lab, /PointerEvent|Apple Pencil|canvas/);
  assert.match(learningApp, /字形鑑識/);
  assert.match(schema, /sqliteTable\(\s*"kana_mastery"/);
  assert.match(api, /onConflictDoUpdate/);
  assert.match(worksheet, /五十音紙筆練習單/);
  assert.match(strokeData, /KanjiVG/);
});

test("scaffolds beginner notes before asking for original sentences", async () => {
  const [client, content] = await Promise.all([
    source("app/components/LearningApp.tsx"),
    source("app/data/lesson-content.ts"),
  ]);

  assert.match(client, /今天最不熟的是哪個假名/);
  assert.match(client, /作答範例/);
  assert.match(client, /不用造句，回答練習狀況即可/);
  assert.match(content, /lesson\.day <= 8/);
  assert.match(content, /lesson\.day <= 12/);
  assert.match(content, /lesson\.day <= 15/);
});
