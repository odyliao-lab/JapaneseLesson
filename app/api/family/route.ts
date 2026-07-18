import { and, eq, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { familyInvites, guardianLinks, lessonAttempts, profiles } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

function createCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  try {
    const db = getDb();
    const links = await db
      .select()
      .from(guardianLinks)
      .where(or(eq(guardianLinks.guardianEmail, user.email), eq(guardianLinks.studentEmail, user.email)));
    const children = [];
    for (const link of links.filter((item) => item.guardianEmail === user.email)) {
      const records = await db
        .select({ day: lessonAttempts.day, score: lessonAttempts.score, minutes: lessonAttempts.minutes, completedAt: lessonAttempts.completedAt })
        .from(lessonAttempts)
        .where(eq(lessonAttempts.email, link.studentEmail));
      children.push({ email: link.studentEmail, records });
    }
    return Response.json({ links, children });
  } catch {
    return Response.json({ error: "家庭連結資料暫時無法讀取" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  const payload = (await request.json()) as { action?: "create" | "redeem"; code?: string };

  try {
    const db = getDb();
    if (payload.action === "create") {
      const code = createCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await db.insert(familyInvites).values({ code, studentEmail: user.email, expiresAt });
      return Response.json({ code, expiresAt });
    }

    if (payload.action === "redeem") {
      const code = payload.code?.trim().toUpperCase() ?? "";
      const [invite] = await db.select().from(familyInvites).where(eq(familyInvites.code, code)).limit(1);
      if (!invite || invite.redeemedBy || new Date(invite.expiresAt) < new Date()) {
        return Response.json({ error: "連結碼無效或已過期" }, { status: 400 });
      }
      if (invite.studentEmail === user.email) {
        return Response.json({ error: "學生與家長需使用不同帳號" }, { status: 400 });
      }
      const existing = await db
        .select()
        .from(guardianLinks)
        .where(and(eq(guardianLinks.guardianEmail, user.email), eq(guardianLinks.studentEmail, invite.studentEmail)))
        .limit(1);
      if (!existing.length) {
        await db.insert(guardianLinks).values({ guardianEmail: user.email, studentEmail: invite.studentEmail });
      }
      await db.update(familyInvites).set({ redeemedBy: user.email }).where(eq(familyInvites.code, code));
      await db
        .insert(profiles)
        .values({ email: user.email, displayName: user.displayName, role: "parent" })
        .onConflictDoUpdate({ target: profiles.email, set: { role: "parent", updatedAt: new Date().toISOString() } });
      return Response.json({ ok: true, studentEmail: invite.studentEmail });
    }
    return Response.json({ error: "無效操作" }, { status: 400 });
  } catch {
    return Response.json({ error: "家庭連結操作失敗" }, { status: 503 });
  }
}
