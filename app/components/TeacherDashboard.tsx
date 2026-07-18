"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";

type Props = { user: ChatGPTUser | null };
type ClassItem = { id: number; name: string; inviteCode: string };
type Assignment = { id: number; title: string; startDay: number; endDay: number; dueDate: string };

const demoStudents = [
  ["林同學", 18, 78, "持續進步"],
  ["陳同學", 16, 84, "聽力表現佳"],
  ["黃同學", 11, 62, "建議複習假名"],
  ["王同學", 20, 91, "可挑戰進階"],
];

export default function TeacherDashboard({ user }: Props) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [message, setMessage] = useState(
    user ? "登入完成，可建立正式班級與作業。" : "目前顯示示範報告；登入後即可保存班級與作業。",
  );

  useEffect(() => {
    if (!user) return;
    void Promise.all([fetch("/api/classes"), fetch("/api/assignments")])
      .then(async ([classResponse, assignmentResponse]) => {
        if (classResponse.ok) setClasses((await classResponse.json()).classes ?? []);
        if (assignmentResponse.ok) setAssignments((await assignmentResponse.json()).assignments ?? []);
      })
      .catch(() => setMessage("資料暫時無法載入，請稍後再試。"));
  }, [user]);

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      window.location.href = "/signin-with-chatgpt?return_to=/teacher";
      return;
    }
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/classes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: data.get("name") }),
    });
    const result = await response.json();
    if (response.ok) {
      setClasses((items) => [result.class, ...items]);
      event.currentTarget.reset();
      setMessage(`已建立「${result.class.name}」，邀請碼：${result.class.inviteCode}`);
    } else {
      setMessage(result.error ?? "建立班級失敗");
    }
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      window.location.href = "/signin-with-chatgpt?return_to=/teacher";
      return;
    }
    const data = new FormData(event.currentTarget);
    const payload = {
      classId: Number(data.get("classId")),
      title: data.get("title"),
      startDay: Number(data.get("startDay")),
      endDay: Number(data.get("endDay")),
      dueDate: data.get("dueDate"),
    };
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (response.ok) {
      setAssignments((items) => [result.assignment, ...items]);
      event.currentTarget.reset();
      setMessage(`已發布作業「${result.assignment.title}」`);
    } else {
      setMessage(result.error ?? "發布作業失敗");
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">探</span>
          <span><strong>日語推理研究所</strong><small>CLASSROOM REPORT</small></span>
        </a>
        <nav className="nav-pills" aria-label="教師頁導覽">
          <a href="/">學習首頁</a>
          <a className="active" href="/teacher">班級報告</a>
        </nav>
        <div className="header-actions">
          {user ? (
            <a className="profile-pill" href="/signout-with-chatgpt?return_to=/teacher">登出</a>
          ) : (
            <a className="profile-pill" href="/signin-with-chatgpt?return_to=/teacher">登入管理</a>
          )}
        </div>
      </header>

      <main className="teacher-wrap">
        <section className="panel teacher-hero">
          <div>
            <span className="eyebrow">CLASSROOM INTELLIGENCE</span>
            <h1>班級搜查報告</h1>
            <p className="lead">查看學生進度、發布指定天數的案件任務，讓家長與老師快速掌握需要支援的線索。</p>
            <div className="status-note" aria-live="polite">{message}</div>
          </div>
          <div className="stat-grid">
            <div className="stat-card"><b>4</b><span>示範學生</span></div>
            <div className="stat-card"><b>16.3</b><span>平均結案天數</span></div>
            <div className="stat-card"><b>79%</b><span>平均正確率</span></div>
            <div className="stat-card"><b>{assignments.length}</b><span>正式作業</span></div>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel dashboard-card">
            <h2>建立班級</h2>
            <p className="muted">系統會產生邀請碼，方便學生加入。</p>
            <form className="form-stack" onSubmit={createClass}>
              <input name="name" placeholder="例如：八年一班日語社" maxLength={60} required />
              <button className="primary-button" type="submit">{user ? "建立正式班級" : "登入後建立"}</button>
            </form>
            {classes.map((item) => (
              <div className="status-note" style={{ marginTop: 10 }} key={item.id}>
                <b>{item.name}</b>・邀請碼 {item.inviteCode}
              </div>
            ))}
          </section>

          <section className="panel dashboard-card">
            <h2>發布案件作業</h2>
            <p className="muted">指定課程範圍與截止日期。</p>
            <form className="form-stack" onSubmit={createAssignment}>
              <select name="classId" required disabled={!classes.length}>
                <option value="">{classes.length ? "選擇班級" : "請先建立班級"}</option>
                {classes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <input name="title" placeholder="作業名稱" maxLength={80} required />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input name="startDay" type="number" min="1" max="60" placeholder="開始 Day" required />
                <input name="endDay" type="number" min="1" max="60" placeholder="結束 Day" required />
              </div>
              <input name="dueDate" type="date" required />
              <button className="primary-button" type="submit">{user ? "發布作業" : "登入後發布"}</button>
            </form>
          </section>

          <section className="panel dashboard-card full">
            <div className="section-heading">
              <div><small className="muted">LEARNING REPORT</small><h2>學生學習概況</h2></div>
              <span className="time-chip">示範資料・正式班級建立後自動更新</span>
            </div>
            {demoStudents.map(([name, day, score, note]) => (
              <div className="student-row" key={String(name)}>
                <strong>{name}</strong>
                <span>DAY {day}</span>
                <div className="mini-track"><div className="progress-fill" style={{ width: `${Number(day) / 60 * 100}%` }} /></div>
                <span style={{ color: "var(--mint)" }}>{score}%・{note}</span>
              </div>
            ))}
          </section>

          <section className="panel dashboard-card full">
            <h2>已發布作業</h2>
            {assignments.length ? assignments.map((item) => (
              <div className="student-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>DAY {item.startDay}–{item.endDay}</span>
                <div className="mini-track"><div className="progress-fill" style={{ width: "0%" }} /></div>
                <span>截止 {item.dueDate}</span>
              </div>
            )) : <p className="muted">目前尚未發布正式作業。</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
