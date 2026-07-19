import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { kanaMastery } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const ratings = new Set(["smooth", "review", "retry"]);

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  try {
    const records = await getDb().select().from(kanaMastery).where(eq(kanaMastery.email, user.email));
    return Response.json({ records });
  } catch {
    return Response.json({ error: "書寫紀錄暫時無法讀取" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });
  const payload = (await request.json()) as { kana?: string; day?: number; rating?: string };
  const kana = payload.kana?.trim() ?? "";
  const day = Math.trunc(Number(payload.day));
  const rating = payload.rating ?? "";
  if ([...kana].length !== 1 || day < 1 || day > 12 || !ratings.has(rating)) {
    return Response.json({ error: "無效的書寫紀錄" }, { status: 400 });
  }
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const [existing] = await db
      .select({ attempts: kanaMastery.attempts })
      .from(kanaMastery)
      .where(and(eq(kanaMastery.email, user.email), eq(kanaMastery.kana, kana)))
      .limit(1);
    await db
      .insert(kanaMastery)
      .values({ email: user.email, kana, day, rating, attempts: 1, updatedAt: now })
      .onConflictDoUpdate({
        target: [kanaMastery.email, kanaMastery.kana],
        set: { day, rating, attempts: (existing?.attempts ?? 0) + 1, updatedAt: now },
      });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "書寫紀錄暫時無法儲存" }, { status: 503 });
  }
}
