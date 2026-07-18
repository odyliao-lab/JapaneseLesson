"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";
import { lessons } from "../data/curriculum";

type Props = { user: ChatGPTUser | null };
type Override = { day: number; title: string; payloadJson: string; updatedAt: string };

export default function ContentAdmin({ user }: Props) {
  const allowed = user?.email === "ody.liao@gmail.com";
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [day, setDay] = useState(1);
  const [title, setTitle] = useState(lessons[0].title);
  const [content, setContent] = useState(JSON.stringify({
    briefing: "輸入案件簡報",
    vocabulary: ["詞彙1", "詞彙2"],
    grammar: "輸入文法說明",
    listening: "輸入聽力文字稿",
    quizNotes: "輸入題目備註",
  }, null, 2));
  const [message, setMessage] = useState(allowed ? "可編輯並保存 60 天課程覆寫內容。" : "只有網站管理者可以使用此頁面。");

  useEffect(() => {
    if (!allowed) return;
    void fetch("/api/content").then(async (response) => {
      if (response.ok) setOverrides((await response.json()).overrides ?? []);
    });
  }, [allowed]);

  function selectDay(value: number) {
    setDay(value);
    const existing = overrides.find((item) => item.day === value);
    setTitle(existing?.title ?? lessons[value - 1].title);
    setContent(existing?.payloadJson ? JSON.stringify(JSON.parse(existing.payloadJson), null, 2) : "{}");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      setMessage("內容 JSON 格式錯誤，請先修正。");
      return;
    }
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day, title, content: parsed }),
    });
    const result = await response.json();
    setMessage(response.ok ? `DAY ${day} 已保存，可在發布前繼續預覽與調整。` : result.error);
    if (response.ok) setOverrides((items) => [...items.filter((item) => item.day !== day), result.override].sort((a, b) => a.day - b.day));
  }

  if (!user) {
    return <AccessPage message="請先登入管理者帳號。" action="/signin-with-chatgpt?return_to=/admin" />;
  }
  if (!allowed) return <AccessPage message="此帳號沒有課程管理權限。" action="/" />;

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">探</span><span><strong>日語推理研究所</strong><small>CONTENT CONTROL</small></span></a>
        <nav className="nav-pills"><a href="/">學習首頁</a><a href="/teacher">班級管理</a><a className="active" href="/admin">內容管理</a></nav>
      </header>
      <main className="teacher-wrap">
        <section className="panel dashboard-card">
          <span className="eyebrow">ADMIN ONLY</span><h1 className="admin-title">60 天課程內容管理</h1>
          <p className="lead">選擇課程、編輯標題與結構化內容。正式資料會保存於雲端，不需要修改程式。</p>
          <div className="status-note" aria-live="polite">{message}</div>
        </section>
        <div className="admin-grid">
          <aside className="panel admin-day-list">
            {lessons.map((lesson) => (
              <button className={lesson.day === day ? "selected" : ""} onClick={() => selectDay(lesson.day)} key={lesson.day}>
                <b>DAY {lesson.day}</b><span>{overrides.some((item) => item.day === lesson.day) ? "已覆寫" : lesson.title}</span>
              </button>
            ))}
          </aside>
          <section className="panel dashboard-card">
            <form className="form-stack" onSubmit={save}>
              <label>課程標題<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
              <label>結構化課程內容 JSON<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={22} spellCheck={false} required /></label>
              <button className="primary-button" type="submit">保存 DAY {day} 內容</button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function AccessPage({ message, action }: { message: string; action: string }) {
  return (
    <div className="site-shell"><main className="teacher-wrap narrow-wrap"><section className="panel dashboard-card access-card"><span className="brand-mark">探</span><h1>課程內容管理</h1><p>{message}</p><a className="primary-button" href={action}>返回／登入</a></section></main></div>
  );
}
