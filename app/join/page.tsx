import { getChatGPTUser } from "../chatgpt-auth";
import JoinClass from "../components/JoinClass";

export const dynamic = "force-dynamic";
export const metadata = { title: "加入班級" };

export default async function JoinPage() {
  const user = await getChatGPTUser();
  return <JoinClass user={user} />;
}
