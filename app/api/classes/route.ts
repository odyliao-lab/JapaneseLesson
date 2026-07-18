import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { classes, profiles } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

function inviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(classes)
      .where(eq(classes.teacherEmail, user.email))
      .orderBy(desc(classes.createdAt));
    return Response.json({ classes: rows });
  } catch {
    return Response.json({ error: "班級資料暫時無法讀取" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

  const payload = (await request.json()) as { name?: string };
  const name = payload.name?.trim().slice(0, 60) ?? "";
  if (!name) return Response.json({ error: "請輸入班級名稱" }, { status: 400 });

  try {
    const db = getDb();
    await db
      .insert(profiles)
      .values({ email: user.email, displayName: user.displayName, role: "teacher" })
      .onConflictDoUpdate({
        target: profiles.email,
        set: { role: "teacher", displayName: user.displayName, updatedAt: new Date().toISOString() },
      });
    const [created] = await db
      .insert(classes)
      .values({ name, teacherEmail: user.email, inviteCode: inviteCode() })
      .returning();

    return Response.json({ class: created }, { status: 201 });
  } catch {
    return Response.json({ error: "建立班級失敗，請稍後再試" }, { status: 503 });
  }
}
