"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AccountForm({ returnTo }: { returnTo: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/local-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: mode,
        email: form.get("email"),
        displayName: form.get("displayName"),
        password: form.get("password"),
        returnTo,
      }),
    });
    const result = await response.json() as { error?: string; returnTo?: string };
    if (response.ok) window.location.assign(result.returnTo ?? "/");
    else setMessage(result.error ?? "操作失敗，請稍後再試。");
    setBusy(false);
  }

  return (
    <form className="panel account-card" onSubmit={submit}>
      <span className="eyebrow">LOCAL LEARNING ACCOUNT</span>
      <h1>{mode === "login" ? "登入學習帳號" : "建立本機學習帳號"}</h1>
      <p className="muted">進度、班級與家庭報告會安全保存在這台主機的資料庫。</p>
      {mode === "register" && <label>顯示名稱<input name="displayName" minLength={2} maxLength={60} required /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>密碼<input name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
      {message && <p className="lesson-message" aria-live="polite">{message}</p>}
      <button className="primary-button" type="submit" disabled={busy}>{busy ? "處理中…" : mode === "login" ? "登入" : "建立帳號"}</button>
      <button className="account-mode" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
        {mode === "login" ? "第一次使用？建立帳號" : "已有帳號？返回登入"}
      </button>
      <Link className="account-back" href="/">先以免登入模式學習</Link>
    </form>
  );
}
