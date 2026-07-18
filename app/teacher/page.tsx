import { getChatGPTUser } from "../chatgpt-auth";
import TeacherDashboard from "../components/TeacherDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "班級與學習報告",
};

export default async function TeacherPage() {
  const user = await getChatGPTUser();
  return <TeacherDashboard user={user} />;
}
