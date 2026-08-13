"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";
import { appPath } from "../base-path";

type Props = { user: ChatGPTUser | null };
type ClassItem = { id: number; name: string; inviteCode: string };
type Assignment = { id: number; classId: number; title: string; startDay: number; endDay: number; dueDate: string };
type Submission = { id: number; assignmentId: number; studentEmail: string; content: string; score: number | null; feedback: string; status: string };
type StudentReport = { email: string; name: string; completedDays: number; average: number; minutes: number; lastActive: string | null; writingChecked: number; writingReview: string[]; support: string };

export default function TeacherDashboard({ user }: Props) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [message, setMessage] = useState(user ? "登入完成，可管理真實班級資料。" : "登入後即可建立班級、作業與學習報告。");

  const selected = classes.find((item) => item.id === selectedClass);
  const classAssignments = useMemo(
    () => assignments.filter((item) => !selectedClass || item.classId === selectedClass),
    [assignments, selectedClass],
  );

  useEffect(() => {
    if (!user) return;
    void loadDashboard();
  }, [user]);

  useEffect(() => {
    if (!selectedClass) return;
    void fetch(appPath(`/api/reports?classId=${selectedClass}`)).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setStudents(data.students ?? []);
    });
  }, [selectedClass]);

  async function loadDashboard() {
    const [classResponse, assignmentResponse, submissionResponse] = await Promise.all([
      fetch(appPath("/api/classes")), fetch(appPath("/api/assignments")), fetch(appPath("/api/submissions")),
    ]);
    if (classResponse.ok) {
      const items = (await classResponse.json()).classes ?? [];
      setClasses(items);
      setSelectedClass((current) => current ?? items[0]?.id ?? null);
    }
    if (assignmentResponse.ok) setAssignments((await assignmentResponse.json()).assignments ?? []);
    if (submissionResponse.ok) setSubmissions((await submissionResponse.json()).submissions ?? []);
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return window.location.assign(appPath("/signin-with-chatgpt?return_to=/teacher"));
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch(appPath("/api/classes"), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: data.get("name") }),
    });
    const result = await response.json();
    if (response.ok) {
      setClasses((items) => [result.class, ...items]);
      setSelectedClass(result.class.id);
      form.reset();
      setMessage(`已建立「${result.class.name}」，邀請碼：${result.class.inviteCode}`);
    } else setMessage(result.error);
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return window.location.assign(appPath("/signin-with-chatgpt?return_to=/teacher"));
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch(appPath("/api/assignments"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        classId: Number(data.get("classId")), title: data.get("title"),
        startDay: Number(data.get("startDay")), endDay: Number(data.get("endDay")), dueDate: data.get("dueDate"),
      }),
    });
    const result = await response.json();
    if (response.ok) {
      setAssignments((items) => [result.assignment, ...items]);
      form.reset();
      setMessage(`已發布作業「${result.assignment.title}」`);
    } else setMessage(result.error);
  }

  async function review(event: FormEvent<HTMLFormElement>, submission: Submission) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch(appPath("/api/submissions"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: submission.id, score: Number(data.get("score")), feedback: data.get("feedback"), status: "reviewed" }),
    });
    const result = await response.json();
    if (response.ok) {
      setMessage(`已完成 ${submission.studentEmail} 的作業批改。`);
      await loadDashboard();
    } else setMessage(result.error);
  }

  async function manageMember(studentEmail: string, action: "remove" | "transfer", toClassId?: number) {
    if (!selectedClass) return;
    const response = await fetch(appPath("/api/classes/members"), {
      method: action === "remove" ? "DELETE" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        action === "remove"
          ? { classId: selectedClass, studentEmail }
          : { fromClassId: selectedClass, toClassId, studentEmail },
      ),
    });
    const result = await response.json();
    if (response.ok) {
      setMessage(action === "remove" ? "學生已移出班級。" : "學生已轉移到其他班級。");
      setStudents((items) => items.filter((item) => item.email !== studentEmail));
    } else setMessage(result.error);
  }

  function exportClassCsv() {
    const rows = [
      ["姓名", "Email", "完成天數", "平均分數", "學習分鐘", "已檢查假名", "待複習假名", "最後活動", "建議"],
      ...students.map((student) => [student.name, student.email, student.completedDays, student.average, student.minutes, student.writingChecked, student.writingReview.join("、"), student.lastActive ?? "", student.support]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected?.name ?? "班級"}-日語學習報告.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const average = students.length ? Math.round(students.reduce((sum, item) => sum + item.average, 0) / students.length) : 0;

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href={appPath("/")}><span className="brand-mark">探</span><span><strong>日語推理研究所</strong><small>CLASSROOM REPORT</small></span></a>
        <nav className="nav-pills"><a href={appPath("/")}>學習首頁</a><a href={appPath("/join")}>學生任務</a><a className="active" href={appPath("/teacher")}>班級報告</a>{user?.email === "ody.liao@gmail.com" && <a href={appPath("/admin")}>內容管理</a>}</nav>
        <div className="header-actions">{user ? <a className="profile-pill" href={appPath("/signout-with-chatgpt?return_to=/teacher")}>登出</a> : <a className="profile-pill" href={appPath("/signin-with-chatgpt?return_to=/teacher")}>登入管理</a>}</div>
      </header>

      <main className="teacher-wrap">
        <section className="panel teacher-hero">
          <div>
            <span className="eyebrow">CLASSROOM INTELLIGENCE</span><h1>班級搜查報告</h1>
            <p className="lead">使用真實學習紀錄追蹤完成度、正確率、學習時間、作業與需要支援的學生。</p>
            <div className="status-note" aria-live="polite">{message}</div>
          </div>
          <div className="stat-grid">
            <div className="stat-card"><b>{students.length}</b><span>班級學生</span></div>
            <div className="stat-card"><b>{students.length ? (students.reduce((sum, item) => sum + item.completedDays, 0) / students.length).toFixed(1) : "0"}</b><span>平均結案天數</span></div>
            <div className="stat-card"><b>{average}%</b><span>平均正確率</span></div>
            <div className="stat-card"><b>{submissions.filter((item) => item.status === "submitted").length}</b><span>待批改作業</span></div>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel dashboard-card">
            <h2>建立班級</h2><p className="muted">系統會產生學生邀請碼。</p>
            <form className="form-stack" onSubmit={createClass}>
              <input name="name" placeholder="例如：八年一班日語社" maxLength={60} required />
              <button className="primary-button" type="submit">{user ? "建立正式班級" : "登入後建立"}</button>
            </form>
            <div className="class-list">
              {classes.map((item) => (
                <button className={selectedClass === item.id ? "selected-class" : ""} onClick={() => setSelectedClass(item.id)} key={item.id}>
                  <b>{item.name}</b><span>邀請碼 {item.inviteCode}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel dashboard-card">
            <h2>發布案件作業</h2><p className="muted">指定課程範圍與截止日期。</p>
            <form className="form-stack" onSubmit={createAssignment}>
              <select name="classId" value={selectedClass ?? ""} onChange={(event) => setSelectedClass(Number(event.target.value))} required disabled={!classes.length}>
                <option value="">{classes.length ? "選擇班級" : "請先建立班級"}</option>
                {classes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <input name="title" placeholder="作業名稱" maxLength={80} required />
              <div className="two-column-inputs"><input name="startDay" type="number" min="1" max="60" placeholder="開始 Day" required /><input name="endDay" type="number" min="1" max="60" placeholder="結束 Day" required /></div>
              <input name="dueDate" type="date" required />
              <button className="primary-button" type="submit">{user ? "發布作業" : "登入後發布"}</button>
            </form>
          </section>

          <section className="panel dashboard-card full">
            <div className="section-heading">
              <div><small className="muted">LIVE LEARNING REPORT</small><h2>{selected?.name ?? "班級"}學習概況</h2></div>
              <div className="report-actions"><button className="secondary-button" onClick={exportClassCsv} disabled={!students.length}>匯出 CSV</button><button className="secondary-button" onClick={() => window.print()}>列印／PDF</button></div>
            </div>
            {students.length ? students.map((student) => (
              <div className="student-row report-row member-report-row" key={student.email}>
                <span><strong>{student.name}</strong><small>{student.email}</small></span>
                <span>DAY {student.completedDays}</span>
                <div className="mini-track"><div className="progress-fill" style={{ width: `${student.completedDays / 60 * 100}%` }} /></div>
                <span className={student.average < 70 ? "needs-support" : "doing-well"}>
                  {student.average}%・{student.support}
                  <small>{student.writingChecked
                    ? `書寫已檢查 ${student.writingChecked} 字${student.writingReview.length ? `・待複習 ${student.writingReview.join("、")}` : ""}`
                    : "尚無紙筆書寫自評"}</small>
                </span>
                <span className="member-actions">
                  {classes.length > 1 && (
                    <select aria-label={`轉移 ${student.name}`} defaultValue="" onChange={(event) => {
                      if (event.target.value) void manageMember(student.email, "transfer", Number(event.target.value));
                    }}>
                      <option value="">轉移至…</option>
                      {classes.filter((item) => item.id !== selectedClass).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  )}
                  <button className="mini-danger" onClick={() => void manageMember(student.email, "remove")}>移出</button>
                </span>
              </div>
            )) : <p className="muted">選擇班級後會顯示真實學生資料；目前班級尚無學生紀錄。</p>}
          </section>

          <section className="panel dashboard-card full">
            <h2>作業與批改</h2>
            <div className="assignment-grid">
              {classAssignments.map((assignment) => (
                <article className="assignment-card" key={assignment.id}>
                  <small>DAY {assignment.startDay}–{assignment.endDay}・截止 {assignment.dueDate}</small><h3>{assignment.title}</h3>
                  <p className="muted">已提交 {submissions.filter((item) => item.assignmentId === assignment.id).length} 份</p>
                  {submissions.filter((item) => item.assignmentId === assignment.id).map((submission) => (
                    <form className="review-card form-stack" onSubmit={(event) => review(event, submission)} key={submission.id}>
                      <b>{submission.studentEmail}</b><p>{submission.content}</p>
                      <div className="two-column-inputs"><input name="score" type="number" min="0" max="100" defaultValue={submission.score ?? 80} required /><input name="feedback" defaultValue={submission.feedback} placeholder="老師回饋" required /></div>
                      <button className="secondary-button" type="submit">保存批改</button>
                    </form>
                  ))}
                </article>
              ))}
              {!classAssignments.length && <p className="muted">目前尚未發布作業。</p>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
