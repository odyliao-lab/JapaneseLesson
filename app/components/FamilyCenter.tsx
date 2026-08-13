"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";
import { appPath } from "../base-path";

type Props = { user: ChatGPTUser | null };
type Child = {
  email: string;
  records: Array<{ day: number; score: number; minutes: number; completedAt: string }>;
  writing: Array<{ kana: string; rating: "smooth" | "review" | "retry"; updatedAt: string }>;
};

export default function FamilyCenter({ user }: Props) {
  const [code, setCode] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [message, setMessage] = useState(user ? "學生可建立連結碼；家長使用自己的帳號兌換。" : "請先登入。");

  async function load() {
    if (!user) return;
    const response = await fetch(appPath("/api/family"));
    if (response.ok) setChildren((await response.json()).children ?? []);
  }

  useEffect(() => { void load(); }, [user]);

  async function createInvite() {
    if (!user) return window.location.assign(appPath("/signin-with-chatgpt?return_to=/family"));
    const response = await fetch(appPath("/api/family"), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create" }),
    });
    const result = await response.json();
    if (response.ok) {
      setCode(result.code);
      setMessage("連結碼 24 小時內有效，請交給家長。");
    } else setMessage(result.error);
  }

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return window.location.assign(appPath("/signin-with-chatgpt?return_to=/family"));
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch(appPath("/api/family"), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "redeem", code: data.get("code") }),
    });
    const result = await response.json();
    setMessage(response.ok ? "已完成家長連結。" : result.error);
    if (response.ok) { form.reset(); await load(); }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href={appPath("/")}><span className="brand-mark">探</span><span><strong>日語推理研究所</strong><small>FAMILY REPORT</small></span></a>
        <nav className="nav-pills"><a href={appPath("/")}>學習首頁</a><a href={appPath("/join")}>加入班級</a><a className="active" href={appPath("/family")}>家長連結</a></nav>
        <div className="header-actions">{user ? <a className="profile-pill" href={appPath("/signout-with-chatgpt?return_to=/family")}>登出</a> : <a className="profile-pill" href={appPath("/signin-with-chatgpt?return_to=/family")}>登入</a>}</div>
      </header>
      <main className="teacher-wrap">
        <section className="panel teacher-hero">
          <div><span className="eyebrow">FAMILY CONNECTION</span><h1>家長連結中心</h1><p className="lead">使用限時連結碼保護學生資料，家長只能查看已由學生主動授權的學習報告。</p><div className="status-note" aria-live="polite">{message}</div></div>
          <div className="stat-grid">
            <button className="stat-card action-stat" onClick={createInvite}><b>{code || "產生"}</b><span>學生建立家長連結碼</span></button>
            <form className="stat-card form-stack" onSubmit={redeem}><input name="code" placeholder="輸入連結碼" maxLength={6} required /><button className="primary-button" type="submit">家長兌換</button></form>
          </div>
        </section>
        <section className="panel dashboard-card page-card">
          <div className="section-heading"><div><small className="muted">CHILD REPORTS</small><h2>已連結學生報告</h2></div><button className="secondary-button" onClick={() => window.print()}>列印／存成 PDF</button></div>
          {children.length ? children.map((child) => {
            const average = child.records.length ? Math.round(child.records.reduce((sum, item) => sum + item.score, 0) / child.records.length) : 0;
            const minutes = child.records.reduce((sum, item) => sum + item.minutes, 0);
            return (
              <article className="family-report" key={child.email}>
                <h3>{child.email}</h3>
                <div className="report-stat-grid">
                  <div className="stat-card"><b>{child.records.length}</b><span>完成天數</span></div>
                  <div className="stat-card"><b>{average}%</b><span>平均分數</span></div>
                  <div className="stat-card"><b>{minutes}</b><span>學習分鐘</span></div>
                  <div className="stat-card"><b>{child.writing?.length ?? 0}</b><span>已檢查假名</span></div>
                </div>
                <div className="review-card">
                  <b>紙筆書寫複習</b>
                  <p>{child.writing?.filter((item) => item.rating !== "smooth").length
                    ? `待複習：${child.writing.filter((item) => item.rating !== "smooth").map((item) => item.kana).join("、")}`
                    : "目前沒有標記需要重練的假名。"}</p>
                </div>
              </article>
            );
          }) : <p className="muted">目前沒有已連結的學生帳號。</p>}
        </section>
      </main>
    </div>
  );
}
