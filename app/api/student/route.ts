import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { assignments, classMembers, classes, notifications, submissions } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

  try {
    const db = getDb();
    const memberships = await db
      .select({ id: classes.id, name: classes.name })
      .from(classMembers)
      .innerJoin(classes, eq(classMembers.classId, classes.id))
      .where(eq(classMembers.studentEmail, user.email));
    const classIds = memberships.map((item) => item.id);
    const classAssignments = classIds.length
      ? await db.select().from(assignments).where(inArray(assignments.classId, classIds)).orderBy(desc(assignments.dueDate))
      : [];
    const submitted = await db
      .select({ assignmentId: submissions.assignmentId, status: submissions.status, feedback: submissions.feedback, score: submissions.score })
      .from(submissions)
      .where(eq(submissions.studentEmail, user.email));
    const notices = await db
      .select()
      .from(notifications)
      .where(eq(notifications.email, user.email))
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    return Response.json({
      classes: memberships,
      assignments: classAssignments.map((assignment) => ({
        ...assignment,
        submission: submitted.find((item) => item.assignmentId === assignment.id) ?? null,
      })),
      notifications: notices,
    });
  } catch {
    return Response.json({ error: "學生任務資料暫時無法讀取" }, { status: 503 });
  }
}
