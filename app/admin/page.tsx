import { getChatGPTUser } from "../chatgpt-auth";
import ContentAdmin from "../components/ContentAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "課程內容管理" };

export default async function AdminPage() {
  const user = await getChatGPTUser();
  return <ContentAdmin user={user} />;
}
