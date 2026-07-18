import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { profiles, progress } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

  try {
    const db = getDb();
    const rows = await db
      .select({ day: progress.day, score: progress.score, minutes: progress.minutes })
      .from(progress)
      .where(eq(progress.email, user.email))
      .orderBy(asc(progress.day));

    return Response.json({
      completedDays: rows.map((row) => row.day),
      records: rows,
    });
  } catch {
    return Response.json({ error: "進度資料暫時無法讀取" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

  const payload = (await request.json()) as { day?: number; score?: number; minutes?: number };
  const day = Math.trunc(Number(payload.day));
  const score = Math.max(0, Math.min(100, Math.trunc(Number(payload.score ?? 0))));
  const minutes = Math.max(0, Math.min(180, Math.trunc(Number(payload.minutes ?? 0))));

  if (!Number.isInteger(day) || day < 1 || day > 60) {
    return Response.json({ error: "課程天數無效" }, { status: 400 });
  }

  try {
    const db = getDb();
    await db
      .insert(profiles)
      .values({ email: user.email, displayName: user.displayName })
      .onConflictDoUpdate({
        target: profiles.email,
        set: { displayName: user.displayName, updatedAt: new Date().toISOString() },
      });

    const existing = await db
      .select()
      .from(progress)
      .where(and(eq(progress.email, user.email), eq(progress.day, day)))
      .limit(1);

    if (existing.length) {
      await db
        .update(progress)
        .set({ score, minutes, completedAt: new Date().toISOString() })
        .where(and(eq(progress.email, user.email), eq(progress.day, day)));
    } else {
      await db.insert(progress).values({ email: user.email, day, score, minutes });
    }

    return Response.json({ ok: true, day });
  } catch {
    return Response.json({ error: "進度資料暫時無法同步" }, { status: 503 });
  }
}
