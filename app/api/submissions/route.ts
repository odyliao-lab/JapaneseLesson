import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { assignments, classes, classMembers, notifications, submissions } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  try {
    const db = getDb();
    const owned = await db.select({ id: classes.id }).from(classes).where(eq(classes.teacherEmail, user.email));
    const ids = owned.map((item) => item.id);
    if (!ids.length) return Response.json({ submissions: [] });
    const classAssignments = await db.select({ id: assignments.id }).from(assignments).where(inArray(assignments.classId, ids));
    const assignmentIds = classAssignments.map((item) => item.id);
    const rows = assignmentIds.length
      ? await db.select().from(submissions).where(inArray(submissions.assignmentId, assignmentIds)).orderBy(desc(submissions.submittedAt))
      : [];
    return Response.json({ submissions: rows });
  } catch {
    return Response.json({ error: "提交資料暫時無法讀取" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  const payload = (await request.json()) as { assignmentId?: number; content?: string };
  const assignmentId = Math.trunc(Number(payload.assignmentId));
  const content = payload.content?.trim().slice(0, 6000) ?? "";
  if (!assignmentId || content.length < 10) return Response.json({ error: "請輸入至少 10 字的結案內容" }, { status: 400 });

  try {
    const db = getDb();
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
    if (!assignment) return Response.json({ error: "找不到作業" }, { status: 404 });
    const member = await db
      .select()
      .from(classMembers)
      .where(and(eq(classMembers.classId, assignment.classId), eq(classMembers.studentEmail, user.email)))
      .limit(1);
    if (!member.length) return Response.json({ error: "你尚未加入此班級" }, { status: 403 });
    await db.delete(submissions).where(and(eq(submissions.assignmentId, assignmentId), eq(submissions.studentEmail, user.email)));
    const [created] = await db.insert(submissions).values({ assignmentId, studentEmail: user.email, content }).returning();
    const [targetClass] = await db.select().from(classes).where(eq(classes.id, assignment.classId)).limit(1);
    if (targetClass) {
      await db.insert(notifications).values({
        email: targetClass.teacherEmail,
        title: "收到新的案件作業",
        body: `${user.displayName} 已提交「${assignment.title}」。`,
      });
    }
    return Response.json({ submission: created }, { status: 201 });
  } catch {
    return Response.json({ error: "提交作業失敗" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  const payload = (await request.json()) as { id?: number; score?: number; feedback?: string; status?: "reviewed" | "returned" };
  const id = Math.trunc(Number(payload.id));
  const score = Math.max(0, Math.min(100, Math.trunc(Number(payload.score ?? 0))));
  const feedback = payload.feedback?.trim().slice(0, 3000) ?? "";
  try {
    const db = getDb();
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
    if (!submission) return Response.json({ error: "找不到提交內容" }, { status: 404 });
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, submission.assignmentId)).limit(1);
    const [targetClass] = assignment
      ? await db.select().from(classes).where(and(eq(classes.id, assignment.classId), eq(classes.teacherEmail, user.email))).limit(1)
      : [];
    if (!targetClass) return Response.json({ error: "沒有批改權限" }, { status: 403 });
    await db.update(submissions).set({
      score,
      feedback,
      status: payload.status ?? "reviewed",
      reviewedAt: new Date().toISOString(),
    }).where(eq(submissions.id, id));
    await db.insert(notifications).values({
      email: submission.studentEmail,
      title: "案件作業已批改",
      body: `${assignment?.title ?? "作業"}：${score} 分。${feedback}`,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "批改失敗" }, { status: 503 });
  }
}
