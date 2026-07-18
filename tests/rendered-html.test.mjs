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
