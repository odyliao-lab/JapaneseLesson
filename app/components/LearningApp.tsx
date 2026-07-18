"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";
import { lessonFlow, lessons, stages, type Lesson, type StageId } from "../data/curriculum";

type Props = {
  user: ChatGPTUser | null;
};

const crew = [
  ["海斗", "發音鑑識", "音", "#35d4f4"],
  ["凜", "文法分析", "文", "#ff7180"],
  ["奏太", "聽力搜查", "聽", "#6489ff"],
  ["美月", "漢字檔案", "字", "#73efc2"],
  ["悠真", "任務指揮", "任", "#f5d85f"],
];

const storageKey = "jpll-progress-v1";
const romajiKey = "jpll-romaji-v1";

export default function LearningApp({ user }: Props) {
  const [completed, setCompleted] = useState<number[]>([]);
  const [romaji, setRomaji] = useState(true);
  const [filter, setFilter] = useState<"all" | StageId>("all");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [ready, setReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as number[];
      setCompleted(saved.filter((day) => Number.isInteger(day) && day >= 1 && day <= 60));
      setRomaji(localStorage.getItem(romajiKey) !== "false");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey, JSON.stringify(completed));
  }, [completed, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(romajiKey, String(romaji));
  }, [romaji, ready]);

  useEffect(() => {
    if (!user || !ready) return;

    void fetch("/api/progress")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { completedDays?: number[] }) => {
        if (data.completedDays?.length) {
          setCompleted((current) => [...new Set([...current, ...data.completedDays!])].sort((a, b) => a - b));
          setSyncMessage("雲端進度已合併");
        }
      })
      .catch(() => setSyncMessage("目前使用本機進度"));
  }, [user, ready]);

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => filter === "all" || lesson.stage === filter),
    [filter],
  );
  const currentDay = lessons.find((lesson) => !completed.includes(lesson.day)) ?? lessons[59];
  const progress = Math.round((completed.length / lessons.length) * 100);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  async function completeLesson(day: number) {
    const next = [...new Set([...completed, day])].sort((a, b) => a - b);
    setCompleted(next);
    setActiveLesson(null);

    if (user) {
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ day, score: 100, minutes: 55 }),
        });
        setSyncMessage(response.ok ? "結案紀錄已同步" : "已保存在這台裝置");
      } catch {
        setSyncMessage("已保存在這台裝置");
      }
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="回到首頁">
          <span className="brand-mark">探</span>
          <span>
            <strong>日語推理研究所</strong>
            <small>謎解き日本語ラボ</small>
          </span>
        </a>
        <nav className="nav-pills" aria-label="主要導覽">
          <a className="active" href="#today">搜查本部</a>
          <a href="#roadmap">案件地圖</a>
          <a href="#lessons">線索手冊</a>
          <a href="/teacher">班級報告</a>
        </nav>
        <div className="header-actions">
          <span className="streak">⚡ 已結案 {completed.length} 天</span>
          {user ? (
            <a className="profile-pill" href="/signout-with-chatgpt?return_to=/">
              <span>{user.displayName}</span>・登出
            </a>
          ) : (
            <a className="profile-pill" href="/signin-with-chatgpt?return_to=/">
              <span>同步進度</span>・登入
            </a>
          )}
        </div>
      </header>

      <main className="page-wrap" id="top">
        <section className="hero-grid" id="today">
          <div className="panel mission-panel">
            <span className="eyebrow">放課後・推理社團任務</span>
            <h1>今日の事件を<br />解き明かそう</h1>
            <p className="lead">
              從聲音、文字到句型，一步步找出日語中的關鍵線索。每天 45–60 分鐘，
              包含可自由安排的獨立搜查時間。
            </p>
            <div className="case-card">
              <div className="day-badge">DAY {String(currentDay.day).padStart(2, "0")}</div>
              <div>
                <small>TODAY&apos;S CASE・今日案件</small>
                <h2>{currentDay.title}</h2>
                <p>{currentDay.focus}・{currentDay.mission}</p>
              </div>
              <button className="primary-button" onClick={() => setActiveLesson(currentDay)}>
                開始搜查 →
              </button>
            </div>
            <div className="progress-row">
              <span>總進度 {progress}%</span>
              <div className="progress-track" aria-label={`總進度 ${progress}%`}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span>下一階：{currentDay.stage === "beginner" ? "線索分析官" : currentDay.stage === "intermediate" ? "真相報告員" : "最終結案"}</span>
            </div>
            {syncMessage && <p className="muted" aria-live="polite" style={{ marginTop: 12 }}>{syncMessage}</p>}
          </div>

          <aside className="panel crew-panel">
            <small className="muted">CLUB MEMBERS</small>
            <h2>你的搜查小隊</h2>
            <p className="muted">五位原創學習夥伴，分工陪你解開每個語言謎題。</p>
            <div className="crew-grid">
              {crew.map(([name, role, badge, color]) => (
                <div className="crew-member" key={name}>
                  <div className="avatar" style={{ "--avatar-color": color } as React.CSSProperties}>
                    <div className="avatar-head" />
                    <div className="avatar-body" />
                    <span className="avatar-badge">{badge}</span>
                  </div>
                  <strong>{name}</strong>
                  <small>{role}</small>
                </div>
              ))}
            </div>
            <div className="crew-note">社團廣播：今天先聽，再大聲念三次！</div>
          </aside>
        </section>

        <section className="panel section" id="roadmap">
          <div className="section-heading">
            <div>
              <small className="muted">INVESTIGATION ROUTE</small>
              <h2>三階段搜查路線</h2>
            </div>
            <span className="time-chip">◷ 每次學習 45–60 分鐘・含獨立搜查</span>
          </div>
          <div className="stage-grid">
            {stages.map((stage) => (
              <article className="stage-card" data-number={stage.number} key={stage.id}>
                <span>{stage.label}</span>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
                <div className="stage-meta">
                  <b>{stage.days}</b>
                  <b>{stage.range}</b>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel section" id="lessons">
          <div className="section-heading">
            <div>
              <small className="muted">CASE FILES 01–60</small>
              <h2>60 天線索手冊</h2>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={romaji}
                onChange={(event) => setRomaji(event.target.checked)}
              />
              顯示羅馬拼音
            </label>
          </div>
          <div className="lesson-toolbar">
            <div className="filter-row" aria-label="篩選課程階段">
              {[
                ["all", "全部 60 天"],
                ["beginner", "新人搜查員"],
                ["intermediate", "線索分析官"],
                ["advanced", "真相報告員"],
              ].map(([value, label]) => (
                <button
                  className={filter === value ? "selected" : ""}
                  onClick={() => setFilter(value as "all" | StageId)}
                  key={value}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="muted">{completed.length} / 60 件已結案</span>
          </div>
          <div className="lesson-grid">
            {visibleLessons.map((lesson) => (
              <button
                className={`lesson-card ${completed.includes(lesson.day) ? "done" : ""}`}
                onClick={() => setActiveLesson(lesson)}
                key={lesson.day}
              >
                <span className="lesson-day">CASE {String(lesson.day).padStart(2, "0")}</span>
                {completed.includes(lesson.day) && <span className="done-mark">✓</span>}
                <h3>{lesson.title}</h3>
                <small>{lesson.focus}</small>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        日語推理研究所・原創語言學習企劃<br />
        城市、角色與案件皆為原創設定，不使用任何既有作品的角色、標誌或故事。
      </footer>

      {activeLesson && (
        <div className="lesson-overlay" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setActiveLesson(null);
        }}>
          <section className="lesson-dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
            <div className="dialog-top">
              <div>
                <span className="eyebrow">CASE {String(activeLesson.day).padStart(2, "0")}・{activeLesson.focus}</span>
                <h2 id="lesson-title" style={{ marginTop: 18, fontSize: 32 }}>{activeLesson.title}</h2>
                <p className="muted">今日任務：{activeLesson.mission}</p>
              </div>
              <button className="close-button" onClick={() => setActiveLesson(null)} aria-label="關閉課程">×</button>
            </div>

            <div className="clue-word">
              <div>
                <b lang="ja">{activeLesson.clue}</b>
                {romaji && <span className="romaji">{activeLesson.romaji}</span>}
                <p className="muted" style={{ margin: "7px 0 0" }}>{activeLesson.meaning}</p>
              </div>
              <button className="voice-button" onClick={() => speak(activeLesson.clue)} aria-label="播放日語發音">♪</button>
            </div>

            <h3>本次 57 分鐘搜查流程</h3>
            <div className="lesson-flow">
              {lessonFlow.map(([title, time, note]) => (
                <div className="flow-step" key={title}>
                  <strong>{title}・{time}</strong>
                  {note}
                </div>
              ))}
            </div>

            <div className="status-note">
              自習提示：將今日線索抄寫三次、播放語音跟讀三次，再用自己的例句完成案件筆記。
            </div>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => speak(activeLesson.clue)}>再聽一次</button>
              <button className="primary-button" onClick={() => completeLesson(activeLesson.day)}>完成並結案 ✓</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
