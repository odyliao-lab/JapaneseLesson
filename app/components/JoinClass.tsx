"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";

type Props = { user: ChatGPTUser | null };
type Assignment = {
  id: number;
  title: string;
  dueDate: string;
  startDay: number;
  endDay: number;
  submission?: { status: string; score: number | null; feedback: string } | null;
};

export default function JoinClass({ user }: Props) {
  const [message, setMessage] = useState(user ? "輸入老師提供的六位邀請碼。" : "登入後即可加入班級。");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    if (!user) return;
    void fetch("/api/student").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setAssignments(data.assignments ?? []);
      setClasses(data.classes ?? []);
    });
  }, [user]);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      window.location.href = "/signin-with-chatgpt?return_to=/join";
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/classes/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inviteCode: data.get("inviteCode") }),
    });
    const result = await response.json();
    setMessage(response.ok ? `已加入「${result.class.name}」` : result.error);
    if (response.ok) {
      setClasses((current) => [...current.filter((item) => item.id !== result.class.id), result.class]);
      form.reset();
    }
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>, assignmentId: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assignmentId, content: data.get("content") }),
    });
    const result = await response.json();
    setMessage(response.ok ? "作業已提交給老師批改。" : result.error);
    if (response.ok) {
      setAssignments((items) => items.map((item) => item.id === assignmentId ? { ...item, submission: result.submission } : item));
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">探</span><span><strong>日語推理研究所</strong><small>STUDENT MISSIONS</small></span></a>
        <nav className="nav-pills"><a href="/">學習首頁</a><a className="active" href="/join">加入班級</a><a href="/family">家長連結</a></nav>
        <div className="header-actions">{user ? <a className="profile-pill" href="/signout-with-chatgpt?return_to=/join">登出</a> : <a className="profile-pill" href="/signin-with-chatgpt?return_to=/join">登入</a>}</div>
      </header>
      <main className="teacher-wrap narrow-wrap">
        <section className="panel teacher-hero">
          <div><span className="eyebrow">JOIN THE CLASS</span><h1>加入班級搜查隊</h1><p className="lead">使用老師提供的邀請碼加入班級，接收作業並提交自己的結案報告。</p><div className="status-note" aria-live="polite">{message}</div></div>
          <form className="form-stack join-form" onSubmit={join}>
            <label>六位班級邀請碼</label>
            <input name="inviteCode" placeholder="ABC123" maxLength={6} required />
            <button className="primary-button" type="submit">{user ? "加入班級" : "登入後加入"}</button>
          </form>
        </section>

        <section className="panel dashboard-card page-card">
          <div className="section-heading"><div><small className="muted">MY CLASSES</small><h2>已加入班級</h2></div></div>
          {classes.length ? classes.map((item) => <div className="status-note" key={item.id}><b>{item.name}</b></div>) : <p className="muted">目前尚未加入班級。</p>}
        </section>

        <section className="panel dashboard-card page-card">
          <div className="section-heading"><div><small className="muted">ASSIGNMENTS</small><h2>班級案件作業</h2></div></div>
          <div className="assignment-grid">
            {assignments.length ? assignments.map((item) => (
              <article className="assignment-card" key={item.id}>
                <small>DAY {item.startDay}–{item.endDay}・截止 {item.dueDate}</small><h3>{item.title}</h3>
                {item.submission ? (
                  <div className="status-note"><b>狀態：{item.submission.status}</b>{item.submission.score !== null && <p>分數：{item.submission.score}</p>}{item.submission.feedback && <p>老師回饋：{item.submission.feedback}</p>}</div>
                ) : (
                  <form className="form-stack" onSubmit={(event) => submitAssignment(event, item.id)}>
                    <textarea name="content" rows={5} placeholder="輸入文字結案報告、練習心得或回答老師指定的任務……" required />
                    <button className="primary-button" type="submit">提交作業</button>
                  </form>
                )}
              </article>
            )) : <p className="muted">目前沒有待完成的班級作業。</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
