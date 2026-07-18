import { getChatGPTUser } from "../chatgpt-auth";
import FamilyCenter from "../components/FamilyCenter";

export const dynamic = "force-dynamic";
export const metadata = { title: "家長連結中心" };

export default async function FamilyPage() {
  const user = await getChatGPTUser();
  return <FamilyCenter user={user} />;
}
