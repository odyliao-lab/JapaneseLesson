import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { classMembers, classes, notifications, profiles } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入後加入班級" }, { status: 401 });
  const payload = (await request.json()) as { inviteCode?: string };
  const inviteCode = payload.inviteCode?.trim().toUpperCase() ?? "";
  if (!inviteCode) return Response.json({ error: "請輸入邀請碼" }, { status: 400 });

  try {
    const db = getDb();
    const [targetClass] = await db.select().from(classes).where(eq(classes.inviteCode, inviteCode)).limit(1);
    if (!targetClass) return Response.json({ error: "找不到此班級，請確認邀請碼" }, { status: 404 });

    const existing = await db
      .select()
      .from(classMembers)
      .where(and(eq(classMembers.classId, targetClass.id), eq(classMembers.studentEmail, user.email)))
      .limit(1);
    if (!existing.length) {
      await db.insert(classMembers).values({
        classId: targetClass.id,
        studentEmail: user.email,
        displayName: user.displayName,
      });
    }
    await db
      .insert(profiles)
      .values({ email: user.email, displayName: user.displayName, role: "student" })
      .onConflictDoUpdate({ target: profiles.email, set: { displayName: user.displayName, updatedAt: new Date().toISOString() } });
    await db.insert(notifications).values({
      email: targetClass.teacherEmail,
      title: "新調查員加入班級",
      body: `${user.displayName} 已加入「${targetClass.name}」。`,
    });
    return Response.json({ class: { id: targetClass.id, name: targetClass.name } });
  } catch {
    return Response.json({ error: "加入班級失敗，請稍後再試" }, { status: 503 });
  }
}
