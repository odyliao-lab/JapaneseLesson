import { getChatGPTUser } from "./chatgpt-auth";
import LearningApp from "./components/LearningApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

  return <LearningApp user={user} />;
}
