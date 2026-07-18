import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { classMembers, classes } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";

async function ownsClass(email: string, classId: number) {
  const db = getDb();
  const rows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherEmail, email)))
    .limit(1);
  return rows.length > 0;
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  const payload = (await request.json()) as { classId?: number; studentEmail?: string };
  const classId = Math.trunc(Number(payload.classId));
  if (!(await ownsClass(user.email, classId))) return Response.json({ error: "沒有管理權限" }, { status: 403 });
  const db = getDb();
  await db.delete(classMembers).where(
    and(eq(classMembers.classId, classId), eq(classMembers.studentEmail, payload.studentEmail ?? "")),
  );
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  const payload = (await request.json()) as { fromClassId?: number; toClassId?: number; studentEmail?: string };
  const fromClassId = Math.trunc(Number(payload.fromClassId));
  const toClassId = Math.trunc(Number(payload.toClassId));
  if (!(await ownsClass(user.email, fromClassId)) || !(await ownsClass(user.email, toClassId))) {
    return Response.json({ error: "沒有管理權限" }, { status: 403 });
  }
  const db = getDb();
  const [member] = await db
    .select()
    .from(classMembers)
    .where(and(eq(classMembers.classId, fromClassId), eq(classMembers.studentEmail, payload.studentEmail ?? "")))
    .limit(1);
  if (!member) return Response.json({ error: "找不到學生" }, { status: 404 });
  await db.delete(classMembers).where(and(eq(classMembers.classId, fromClassId), eq(classMembers.studentEmail, member.studentEmail)));
  const existing = await db
    .select()
    .from(classMembers)
    .where(and(eq(classMembers.classId, toClassId), eq(classMembers.studentEmail, member.studentEmail)))
    .limit(1);
  if (!existing.length) await db.insert(classMembers).values({ ...member, classId: toClassId });
  return Response.json({ ok: true });
}
