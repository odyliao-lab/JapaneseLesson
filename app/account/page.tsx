import AccountForm from "./AccountForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "學習帳號" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) {
  const { return_to: returnTo = "/" } = await searchParams;
  return <main className="account-page"><AccountForm returnTo={safeReturnTo(returnTo)} /></main>;
}

function safeReturnTo(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
