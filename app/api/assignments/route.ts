import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { assignments, classes, classMembers, notifications } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

  try {
    const db = getDb();
    const ownedClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.teacherEmail, user.email));
    const ids = new Set(ownedClasses.map((item) => item.id));
    const rows = await db.select().from(assignments).orderBy(desc(assignments.createdAt));
    return Response.json({ assignments: rows.filter((item) => ids.has(item.classId)) });
  } catch {
    return Response.json({ error: "作業資料暫時無法讀取" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

  const payload = (await request.json()) as {
    classId?: number;
    title?: string;
    startDay?: number;
    endDay?: number;
    dueDate?: string;
  };
  const classId = Math.trunc(Number(payload.classId));
  const startDay = Math.trunc(Number(payload.startDay));
  const endDay = Math.trunc(Number(payload.endDay));
  const title = payload.title?.trim().slice(0, 80) ?? "";
  const dueDate = payload.dueDate?.trim() ?? "";

  if (!title || !dueDate || startDay < 1 || endDay > 60 || startDay > endDay) {
    return Response.json({ error: "請完整填寫 1–60 天範圍與截止日" }, { status: 400 });
  }

  try {
    const db = getDb();
    const owned = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.teacherEmail, user.email)))
      .limit(1);
    if (!owned.length) return Response.json({ error: "無權限使用此班級" }, { status: 403 });

    const [created] = await db
      .insert(assignments)
      .values({ classId, title, startDay, endDay, dueDate, createdBy: user.email })
      .returning();
    const members = await db
      .select({ email: classMembers.studentEmail })
      .from(classMembers)
      .where(eq(classMembers.classId, classId));
    if (members.length) {
      await db.insert(notifications).values(
        members.map((member) => ({
          email: member.email,
          title: "收到新的班級作業",
          body: `${title}・DAY ${startDay}–${endDay}・截止 ${dueDate}`,
        })),
      );
    }
    return Response.json({ assignment: created }, { status: 201 });
  } catch {
    return Response.json({ error: "建立作業失敗，請稍後再試" }, { status: 503 });
  }
}
