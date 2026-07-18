import { asc } from "drizzle-orm";
import { getDb } from "../db";
import { lessonOverrides } from "../db/schema";
import { getChatGPTUser } from "./chatgpt-auth";
import LearningApp from "./components/LearningApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  let overrides: Array<{ day: number; title: string; payloadJson: string }> = [];
  try {
    overrides = await getDb()
      .select({ day: lessonOverrides.day, title: lessonOverrides.title, payloadJson: lessonOverrides.payloadJson })
      .from(lessonOverrides)
      .orderBy(asc(lessonOverrides.day));
  } catch {
    // Local preview and a brand-new deployment may not have D1 ready yet.
  }

  return <LearningApp user={user} overrides={overrides} />;
}
