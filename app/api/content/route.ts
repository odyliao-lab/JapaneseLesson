import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { lessonOverrides } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const adminEmails = new Set(["ody.liao@gmail.com"]);

export async function GET() {
  try {
    const db = getDb();
    const overrides = await db.select().from(lessonOverrides).orderBy(asc(lessonOverrides.day));
    return Response.json({ overrides });
  } catch {
    return Response.json({ overrides: [] });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !adminEmails.has(user.email)) {
    return Response.json({ error: "只有網站管理者可編輯課程" }, { status: 403 });
  }
  const payload = (await request.json()) as { day?: number; title?: string; content?: unknown };
  const day = Math.trunc(Number(payload.day));
  const title = payload.title?.trim().slice(0, 120) ?? "";
  if (day < 1 || day > 60 || !title) return Response.json({ error: "課程資料無效" }, { status: 400 });
  try {
    const db = getDb();
    const [existing] = await db.select().from(lessonOverrides).where(eq(lessonOverrides.day, day)).limit(1);
    const values = {
      day,
      title,
      payloadJson: JSON.stringify(payload.content ?? {}),
      updatedBy: user.email,
      updatedAt: new Date().toISOString(),
    };
    if (existing) await db.update(lessonOverrides).set(values).where(eq(lessonOverrides.day, day));
    else await db.insert(lessonOverrides).values(values);
    return Response.json({ override: values });
  } catch {
    return Response.json({ error: "課程儲存失敗" }, { status: 503 });
  }
}
