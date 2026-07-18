import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { assignments, classes, classMembers, lessonAttempts, submissions } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  const classId = Math.trunc(Number(new URL(request.url).searchParams.get("classId")));
  try {
    const db = getDb();
    const [targetClass] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    if (!targetClass || targetClass.teacherEmail !== user.email) {
      return Response.json({ error: "沒有查看此班級的權限" }, { status: 403 });
    }
    const members = await db.select().from(classMembers).where(eq(classMembers.classId, classId));
    const emails = members.map((item) => item.studentEmail);
    const attempts = emails.length
      ? await db.select().from(lessonAttempts).where(inArray(lessonAttempts.email, emails))
      : [];
    const classAssignments = await db.select().from(assignments).where(eq(assignments.classId, classId));
    const assignmentIds = classAssignments.map((item) => item.id);
    const submitted = assignmentIds.length
      ? await db.select().from(submissions).where(inArray(submissions.assignmentId, assignmentIds))
      : [];
    const students = members.map((member) => {
      const records = attempts.filter((item) => item.email === member.studentEmail);
      const minutes = records.reduce((sum, item) => sum + item.minutes, 0);
      const average = records.length ? Math.round(records.reduce((sum, item) => sum + item.score, 0) / records.length) : 0;
      return {
        email: member.studentEmail,
        name: member.displayName,
        completedDays: records.length,
        average,
        minutes,
        lastActive: records.sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0]?.completedAt ?? null,
        support: average < 70 ? "建議安排複習" : records.length >= 44 ? "可挑戰 N4" : "持續進步",
      };
    });
    return Response.json({ class: targetClass, students, assignments: classAssignments, submissions: submitted });
  } catch {
    return Response.json({ error: "報告資料暫時無法讀取" }, { status: 503 });
  }
}
