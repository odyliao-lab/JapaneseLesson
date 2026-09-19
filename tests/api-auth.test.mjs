import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import {
  clearAuthHeaders,
  resetMockDb,
  setAuthHeaders,
  setSelectResults,
} from "./mocks/state.mjs";

const progress = await import("../app/api/progress/route.ts");
const classes = await import("../app/api/classes/route.ts");
const join = await import("../app/api/classes/join/route.ts");
const members = await import("../app/api/classes/members/route.ts");
const assignments = await import("../app/api/assignments/route.ts");
const submissions = await import("../app/api/submissions/route.ts");
const reports = await import("../app/api/reports/route.ts");
const family = await import("../app/api/family/route.ts");
const student = await import("../app/api/student/route.ts");
const kana = await import("../app/api/kana/route.ts");
const content = await import("../app/api/content/route.ts");
const { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } = await import(
  "../app/chatgpt-auth.ts"
);

const ADMIN_EMAIL = "ody.liao@gmail.com";
const TEACHER_EMAIL = "teacher@example.com";
const STUDENT_EMAIL = "student@example.com";

function jsonRequest(url, method, body) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

function signIn(email, fullName) {
  const headers = { "oai-authenticated-user-email": email };
  if (fullName) {
    headers["oai-authenticated-user-full-name"] = encodeURIComponent(fullName);
    headers["oai-authenticated-user-full-name-encoding"] = "percent-encoded-utf-8";
  }
  setAuthHeaders(headers);
}

async function read(response) {
  const body = await response.json();
  return { status: response.status, body };
}

beforeEach(() => {
  clearAuthHeaders();
  resetMockDb();
});

describe("ChatGPT Sites identity headers", () => {
  test("missing email header means the request is unauthenticated", async () => {
    assert.equal(await getChatGPTUser(), null);
  });

  test("email-only identity uses the email as the display name", async () => {
    signIn(STUDENT_EMAIL);
    assert.deepEqual(await getChatGPTUser(), {
      displayName: STUDENT_EMAIL,
      email: STUDENT_EMAIL,
      fullName: null,
    });
  });

  test("percent-encoded full name is decoded when the encoding header matches", async () => {
    signIn(STUDENT_EMAIL, "山田 太郎");
    assert.deepEqual(await getChatGPTUser(), {
      displayName: "山田 太郎",
      email: STUDENT_EMAIL,
      fullName: "山田 太郎",
    });
  });

  test("sign-in return_to is forced to a same-origin relative path", () => {
    assert.equal(chatGPTSignInPath("/teacher"), "/signin-with-chatgpt?return_to=%2Fteacher");
    assert.equal(chatGPTSignInPath("//evil.example"), "/signin-with-chatgpt?return_to=%2F");
    assert.equal(chatGPTSignInPath("https://evil.example/"), "/signin-with-chatgpt?return_to=%2F");
    assert.equal(chatGPTSignInPath("/signin-with-chatgpt"), "/signin-with-chatgpt?return_to=%2F");
  });

  test("sign-out return_to is sanitized the same way", () => {
    assert.equal(chatGPTSignOutPath("/family"), "/signout-with-chatgpt?return_to=%2Ffamily");
    assert.equal(chatGPTSignOutPath("//evil.example"), "/signout-with-chatgpt?return_to=%2F");
  });
});

describe("unauthenticated requests on protected APIs", () => {
  const cases = [
    ["GET /api/progress", () => progress.GET()],
    ["POST /api/progress", () => progress.POST(jsonRequest("https://app.local/api/progress", "POST"))],
    ["GET /api/classes", () => classes.GET()],
    ["POST /api/classes", () => classes.POST(jsonRequest("https://app.local/api/classes", "POST", { name: "A" }))],
    ["POST /api/classes/join", () => join.POST(jsonRequest("https://app.local/api/classes/join", "POST", { inviteCode: "ABC123" }))],
    ["DELETE /api/classes/members", () => members.DELETE(jsonRequest("https://app.local/api/classes/members", "DELETE", { classId: 1 }))],
    ["PATCH /api/classes/members", () => members.PATCH(jsonRequest("https://app.local/api/classes/members", "PATCH", { fromClassId: 1, toClassId: 2 }))],
    ["GET /api/assignments", () => assignments.GET()],
    ["POST /api/assignments", () => assignments.POST(jsonRequest("https://app.local/api/assignments", "POST", { classId: 1, title: "作業", startDay: 1, endDay: 2, dueDate: "2026-09-30" }))],
    ["GET /api/submissions", () => submissions.GET()],
    ["POST /api/submissions", () => submissions.POST(jsonRequest("https://app.local/api/submissions", "POST", { assignmentId: 1, content: "這是足夠長度的結案內容" }))],
    ["PATCH /api/submissions", () => submissions.PATCH(jsonRequest("https://app.local/api/submissions", "PATCH", { id: 1, score: 80 }))],
    ["GET /api/reports", () => reports.GET(new Request("https://app.local/api/reports?classId=1"))],
    ["GET /api/family", () => family.GET()],
    ["POST /api/family", () => family.POST(jsonRequest("https://app.local/api/family", "POST", { action: "create" }))],
    ["GET /api/student", () => student.GET()],
    ["GET /api/kana", () => kana.GET()],
    ["POST /api/kana", () => kana.POST(jsonRequest("https://app.local/api/kana", "POST", { kana: "あ", day: 1, rating: "smooth" }))],
  ];

  for (const [name, call] of cases) {
    test(`${name} returns 401`, async () => {
      const { status, body } = await read(await call());
      assert.equal(status, 401);
      assert.match(String(body.error ?? ""), /請先登入/);
    });
  }
});

describe("content admin gate", () => {
  const payload = { day: 3, title: "線索更新", content: { note: "x" } };

  test("GET /api/content stays public (no login required)", async () => {
    setSelectResults([]);
    const { status, body } = await read(await content.GET());
    assert.equal(status, 200);
    assert.deepEqual(body.overrides, []);
  });

  test("POST /api/content is 403 when unauthenticated (not 401)", async () => {
    const { status, body } = await read(
      await content.POST(jsonRequest("https://app.local/api/content", "POST", payload)),
    );
    assert.equal(status, 403);
    assert.equal(body.error, "只有網站管理者可編輯課程");
  });

  test("POST /api/content is 403 for a signed-in non-admin", async () => {
    signIn(TEACHER_EMAIL);
    const { status, body } = await read(
      await content.POST(jsonRequest("https://app.local/api/content", "POST", payload)),
    );
    assert.equal(status, 403);
    assert.equal(body.error, "只有網站管理者可編輯課程");
  });

  test("POST /api/content allows the hardcoded admin email past the gate", async () => {
    signIn(ADMIN_EMAIL);
    setSelectResults([]);
    const { status, body } = await read(
      await content.POST(jsonRequest("https://app.local/api/content", "POST", payload)),
    );
    assert.equal(status, 200);
    assert.equal(body.override.day, 3);
    assert.equal(body.override.updatedBy, ADMIN_EMAIL);
  });
});

describe("teacher-only and membership gates", () => {
  test("POST /api/assignments is 403 when the caller does not own the class", async () => {
    signIn(STUDENT_EMAIL);
    setSelectResults([]);
    const { status, body } = await read(
      await assignments.POST(
        jsonRequest("https://app.local/api/assignments", "POST", {
          classId: 9,
          title: "DAY 1–3 複習",
          startDay: 1,
          endDay: 3,
          dueDate: "2026-09-30",
        }),
      ),
    );
    assert.equal(status, 403);
    assert.equal(body.error, "無權限使用此班級");
  });

  test("GET /api/reports is 403 when the class is missing or owned by someone else", async () => {
    signIn(STUDENT_EMAIL);
    setSelectResults([{ id: 1, teacherEmail: TEACHER_EMAIL, name: "A 班" }]);
    const { status, body } = await read(
      await reports.GET(new Request("https://app.local/api/reports?classId=1")),
    );
    assert.equal(status, 403);
    assert.equal(body.error, "沒有查看此班級的權限");
  });

  test("POST /api/submissions is 403 when the caller is not a class member", async () => {
    signIn(STUDENT_EMAIL);
    setSelectResults([{ id: 4, classId: 1, title: "結案" }], []);
    const { status, body } = await read(
      await submissions.POST(
        jsonRequest("https://app.local/api/submissions", "POST", {
          assignmentId: 4,
          content: "這是足夠長度的結案內容",
        }),
      ),
    );
    assert.equal(status, 403);
    assert.equal(body.error, "你尚未加入此班級");
  });

  test("PATCH /api/submissions is 403 when the caller is not the class teacher", async () => {
    signIn(STUDENT_EMAIL);
    setSelectResults(
      [{ id: 11, assignmentId: 4, studentEmail: STUDENT_EMAIL }],
      [{ id: 4, classId: 1, title: "結案" }],
      [],
    );
    const { status, body } = await read(
      await submissions.PATCH(
        jsonRequest("https://app.local/api/submissions", "PATCH", {
          id: 11,
          score: 90,
          feedback: "ok",
        }),
      ),
    );
    assert.equal(status, 403);
    assert.equal(body.error, "沒有批改權限");
  });

  test("DELETE /api/classes/members is 403 when the caller does not own the class", async () => {
    signIn(STUDENT_EMAIL);
    setSelectResults([]);
    const { status, body } = await read(
      await members.DELETE(
        jsonRequest("https://app.local/api/classes/members", "DELETE", {
          classId: 1,
          studentEmail: "other@example.com",
        }),
      ),
    );
    assert.equal(status, 403);
    assert.equal(body.error, "沒有管理權限");
  });

  test("PATCH /api/classes/members is 403 when either class is not owned", async () => {
    signIn(TEACHER_EMAIL);
    setSelectResults([{ id: 1 }], []);
    const { status, body } = await read(
      await members.PATCH(
        jsonRequest("https://app.local/api/classes/members", "PATCH", {
          fromClassId: 1,
          toClassId: 2,
          studentEmail: STUDENT_EMAIL,
        }),
      ),
    );
    assert.equal(status, 403);
    assert.equal(body.error, "沒有管理權限");
  });

  test("GET /api/reports is allowed for the class teacher", async () => {
    signIn(TEACHER_EMAIL);
    setSelectResults(
      [{ id: 1, teacherEmail: TEACHER_EMAIL, name: "A 班" }],
      [],
      [],
    );
    const { status, body } = await read(
      await reports.GET(new Request("https://app.local/api/reports?classId=1")),
    );
    assert.equal(status, 200);
    assert.equal(body.class.name, "A 班");
    assert.deepEqual(body.students, []);
  });

  test("POST /api/assignments is allowed for the class teacher", async () => {
    signIn(TEACHER_EMAIL);
    setSelectResults([{ id: 9 }], []);
    const { status, body } = await read(
      await assignments.POST(
        jsonRequest("https://app.local/api/assignments", "POST", {
          classId: 9,
          title: "DAY 1–3 複習",
          startDay: 1,
          endDay: 3,
          dueDate: "2026-09-30",
        }),
      ),
    );
    assert.equal(status, 201);
    assert.ok(body.assignment);
  });
});
