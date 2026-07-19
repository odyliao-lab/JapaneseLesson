"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatGPTUser } from "../chatgpt-auth";
import { lessons, stages, type Lesson, type StageId } from "../data/curriculum";
import { badgeCatalog, buildLessonContent, lessonLevel } from "../data/lesson-content";
import KanaWritingLab from "./KanaWritingLab";

type Props = {
  user: ChatGPTUser | null;
  overrides: Array<{ day: number; title: string; payloadJson: string }>;
};
type Attempt = {
  day: number;
  score: number;
  minutes: number;
  note: string;
  completedAt: string;
};
type StudentData = {
  assignments?: Array<{ id: number; title: string; dueDate: string; startDay: number; endDay: number }>;
  notifications?: Array<{ id: number; title: string; body: string }>;
  classes?: Array<{ id: number; name: string }>;
};

const crew = [
  ["海斗", "發音鑑識", "音", "#35d4f4", "先聽拍子，再放心開口。"],
  ["凜", "文法分析", "文", "#ff7180", "把句子拆開，規則就會現身。"],
  ["奏太", "聽力搜查", "聽", "#6489ff", "關鍵音通常藏在第二次播放。"],
  ["美月", "漢字檔案", "字", "#73efc2", "用部件和故事記住漢字。"],
  ["悠真", "任務指揮", "任", "#f5d85f", "完成自習筆記才算真正結案。"],
];

const storageKey = "jpll-progress-v2";
const legacyStorageKey = "jpll-progress-v1";
const attemptKey = "jpll-attempts-v2";
const romajiKey = "jpll-romaji-v1";
const standardSteps = ["案件簡報", "線索詞彙", "文法鑑識", "聽力證詞", "獨立搜查", "結案測驗", "案件報告"];
const kanaSteps = ["案件簡報", "字形鑑識", "線索詞彙", "文法鑑識", "聽力證詞", "獨立搜查", "結案測驗", "案件報告"];

export default function LearningApp({ user, overrides }: Props) {
  const [completed, setCompleted] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [romaji, setRomaji] = useState(true);
  const [filter, setFilter] = useState<"all" | StageId>("all");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [studyNote, setStudyNote] = useState("");
  const [studyMinutes, setStudyMinutes] = useState(55);
  const [lessonMessage, setLessonMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [studentData, setStudentData] = useState<StudentData>({});
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    try {
      const v2 = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as number[];
      const legacy = JSON.parse(localStorage.getItem(legacyStorageKey) ?? "[]") as number[];
      const savedAttempts = JSON.parse(localStorage.getItem(attemptKey) ?? "[]") as Attempt[];
      setCompleted([...new Set([...v2, ...legacy])].filter(validDay).sort((a, b) => a - b));
      setAttempts(savedAttempts.filter((item) => validDay(item.day)));
      setRomaji(localStorage.getItem(romajiKey) !== "false");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey, JSON.stringify(completed));
    localStorage.setItem(attemptKey, JSON.stringify(attempts));
  }, [completed, attempts, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(romajiKey, String(romaji));
  }, [romaji, ready]);

  useEffect(() => {
    if (!user || !ready) return;
    void Promise.all([fetch("/api/progress"), fetch("/api/student")])
      .then(async ([progressResponse, studentResponse]) => {
        if (progressResponse.ok) {
          const data = (await progressResponse.json()) as { completedDays?: number[]; records?: Attempt[] };
          setCompleted((current) =>
            [...new Set([...current, ...(data.completedDays ?? [])])].sort((a, b) => a - b),
          );
          if (data.records?.length) setAttempts(data.records);
        }
        if (studentResponse.ok) setStudentData(await studentResponse.json());
        setSyncMessage("雲端進度與任務已同步");
      })
      .catch(() => setSyncMessage("目前使用本機進度"));
  }, [user, ready]);

  const effectiveLessons = useMemo(
    () => lessons.map((lesson) => {
      const override = overrides.find((item) => item.day === lesson.day);
      return override ? { ...lesson, title: override.title } : lesson;
    }),
    [overrides],
  );
  const visibleLessons = useMemo(
    () => effectiveLessons.filter((lesson) => filter === "all" || lesson.stage === filter),
    [effectiveLessons, filter],
  );
  const currentDay = effectiveLessons.find((lesson) => !completed.includes(lesson.day)) ?? effectiveLessons[59];
  const progressPercent = Math.round((completed.length / effectiveLessons.length) * 100);
  const xp = completed.length * 100 + attempts.reduce((sum, item) => sum + item.score, 0);
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length)
    : 0;
  const totalMinutes = attempts.reduce((sum, item) => sum + item.minutes, 0);
  const earnedBadges = badgeCatalog.filter((badge) => completed.length >= badge.threshold);
  const content = activeLesson
    ? mergeOverride(buildLessonContent(activeLesson), overrides.find((item) => item.day === activeLesson.day)?.payloadJson)
    : null;
  const isKanaLesson = Boolean(activeLesson && activeLesson.day <= 12);
  const lessonSteps = isKanaLesson ? kanaSteps : standardSteps;
  const isKanaStep = isKanaLesson && activeStep === 1;
  const contentStep = activeStep - (isKanaLesson && activeStep > 1 ? 1 : 0);

  function validDay(day: number) {
    return Number.isInteger(day) && day >= 1 && day <= 60;
  }

  function openLesson(lesson: Lesson) {
    setActiveLesson(lesson);
    setActiveStep(0);
    setAnswers({});
    setStudyNote(attempts.find((item) => item.day === lesson.day)?.note ?? "");
    setStudyMinutes(55);
    setLessonMessage("");
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl("");
  }

  function speak(text: string, rate = 0.82) {
    if (!("speechSynthesis" in window)) {
      setLessonMessage("此瀏覽器不支援語音播放。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecording(true);
      setLessonMessage("錄音中：請朗讀今日核心句。");
    } catch {
      setLessonMessage("無法啟用麥克風；請確認瀏覽器權限。");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    setLessonMessage("錄音完成，請播放並和標準語音比較。");
  }

  async function completeLesson() {
    if (!activeLesson || !content) return;
    if (Object.keys(answers).length < content.quizzes.length) {
      setLessonMessage("請先完成全部五題結案測驗。");
      setActiveStep(isKanaLesson ? 6 : 5);
      return;
    }
    if (studyNote.trim().length < 20) {
      setLessonMessage("請留下至少 20 個字的自習／案件筆記。");
      setActiveStep(4);
      return;
    }
    const correct = content.quizzes.filter((quiz) => answers[quiz.id] === quiz.answer).length;
    const score = Math.round((correct / content.quizzes.length) * 100);
    const completedAt = new Date().toISOString();
    const attempt = {
      day: activeLesson.day,
      score,
      minutes: Math.max(15, Math.min(90, studyMinutes)),
      note: studyNote.trim(),
      completedAt,
    };
    setCompleted((current) => [...new Set([...current, activeLesson.day])].sort((a, b) => a - b));
    setAttempts((current) => [...current.filter((item) => item.day !== activeLesson.day), attempt]);
    setLessonMessage(`案件結案：答對 ${correct}/5 題，得分 ${score}。`);

    if (user) {
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...attempt, answers }),
        });
        setSyncMessage(response.ok ? "結案紀錄已同步到雲端" : "已保存在這台裝置");
      } catch {
        setSyncMessage("已保存在這台裝置");
      }
    }
  }

  function exportPersonalCsv() {
    const rows = [
      ["Day", "課程", "JLPT", "分數", "分鐘", "完成時間"],
      ...attempts
        .sort((a, b) => a.day - b.day)
        .map((attempt) => [
          attempt.day,
          effectiveLessons[attempt.day - 1]?.title ?? "",
          lessonLevel(attempt.day),
          attempt.score,
          attempt.minutes,
          attempt.completedAt,
        ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "日語推理研究所-個人學習報告.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="回到首頁">
          <span className="brand-mark">探</span>
          <span><strong>日語推理研究所</strong><small>謎解き日本語ラボ</small></span>
        </a>
        <nav className="nav-pills" aria-label="主要導覽">
          <a className="active" href="#today">搜查本部</a>
          <a href="#roadmap">案件地圖</a>
          <a href="#lessons">線索手冊</a>
          <a href="#profile">我的報告</a>
          <a href="/join">加入班級</a>
          <a href="/teacher">班級管理</a>
        </nav>
        <div className="header-actions">
          <span className="streak">⚡ {xp} XP</span>
          {user ? (
            <a className="profile-pill" href="/signout-with-chatgpt?return_to=/"><span>{user.displayName}</span>・登出</a>
          ) : (
            <a className="profile-pill" href="/signin-with-chatgpt?return_to=/"><span>同步進度</span>・登入</a>
          )}
        </div>
      </header>

      <main className="page-wrap" id="top">
        <section className="hero-grid" id="today">
          <div className="panel mission-panel">
            <span className="eyebrow">放課後・推理社團任務</span>
            <h1>今日の事件を<br />解き明かそう</h1>
            <p className="lead">
              每課包含詞彙、文法、聽力、互動測驗與 15 分鐘獨立搜查。
              完成完整紀錄後，案件才會正式結案。
            </p>
            <div className="case-card">
              <div className="day-badge">DAY {String(currentDay.day).padStart(2, "0")}</div>
              <div>
                <small>TODAY&apos;S CASE・{lessonLevel(currentDay.day)}</small>
                <h2>{currentDay.title}</h2>
                <p>{currentDay.focus}・{currentDay.mission}</p>
              </div>
              <button className="primary-button" onClick={() => openLesson(currentDay)}>開始完整課堂 →</button>
            </div>
            <div className="progress-row">
              <span>總進度 {progressPercent}%</span>
              <div className="progress-track" aria-label={`總進度 ${progressPercent}%`}>
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <span>{completed.length}/60 件結案</span>
            </div>
            {syncMessage && <p className="muted sync-line" aria-live="polite">{syncMessage}</p>}
          </div>

          <aside className="panel crew-panel">
            <small className="muted">ORIGINAL CLUB MEMBERS</small>
            <h2>你的五人搜查小隊</h2>
            <p className="muted">原創角色會在不同學習環節提供提示。</p>
            <Image className="crew-art" src="/crew-v1.png" alt="五位原創日語學習搜查員" width={1693} height={929} priority />
            <div className="crew-role-list">
              {crew.map(([name, role, badge, color]) => (
                <span key={name} style={{ "--crew": color } as React.CSSProperties}><b>{badge}</b>{name}・{role}</span>
              ))}
            </div>
          </aside>
        </section>

        {(studentData.notifications?.length || studentData.assignments?.length) ? (
          <section className="panel section alert-section" aria-label="學習通知">
            <div>
              <small className="muted">MISSION ALERTS</small>
              <h2>最新任務與提醒</h2>
            </div>
            <div className="alert-grid">
              {studentData.assignments?.slice(0, 3).map((item) => (
                <article className="notification-card" key={`a-${item.id}`}>
                  <b>班級作業・{item.title}</b>
                  <span>DAY {item.startDay}–{item.endDay}・截止 {item.dueDate}</span>
                </article>
              ))}
              {studentData.notifications?.slice(0, 3).map((item) => (
                <article className="notification-card" key={`n-${item.id}`}>
                  <b>{item.title}</b><span>{item.body}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="panel section" id="roadmap">
          <div className="section-heading">
            <div><small className="muted">INVESTIGATION ROUTE</small><h2>三階段搜查路線</h2></div>
            <span className="time-chip">◷ 每課 45–60 分鐘・6個學習環節＋結案</span>
          </div>
          <div className="stage-grid">
            {stages.map((stage) => (
              <article className="stage-card" data-number={stage.number} key={stage.id}>
                <span>{stage.label}</span><h3>{stage.title}</h3><p>{stage.description}</p>
                <div className="stage-meta"><b>{stage.days}</b><b>{stage.range}</b></div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel section" id="lessons">
          <div className="section-heading">
            <div><small className="muted">CASE FILES 01–60</small><h2>60 天完整線索手冊</h2></div>
            <label className="toggle">
              <input type="checkbox" checked={romaji} onChange={(event) => setRomaji(event.target.checked)} />
              顯示羅馬拼音
            </label>
          </div>
          <div className="lesson-toolbar">
            <div className="filter-row" aria-label="篩選課程階段">
              {[
                ["all", "全部 60 天"], ["beginner", "新人搜查員"],
                ["intermediate", "線索分析官"], ["advanced", "真相報告員"],
              ].map(([value, label]) => (
                <button className={filter === value ? "selected" : ""} onClick={() => setFilter(value as "all" | StageId)} key={value}>{label}</button>
              ))}
            </div>
            <span className="muted">{completed.length} / 60 件已結案</span>
          </div>
          <div className="lesson-grid">
            {visibleLessons.map((lesson) => {
              const attempt = attempts.find((item) => item.day === lesson.day);
              return (
                <button className={`lesson-card ${completed.includes(lesson.day) ? "done" : ""}`} onClick={() => openLesson(lesson)} key={lesson.day}>
                  <span className="lesson-day">CASE {String(lesson.day).padStart(2, "0")}・{lessonLevel(lesson.day)}</span>
                  {completed.includes(lesson.day) && <span className="done-mark">✓</span>}
                  <h3>{lesson.title}</h3>
                  <small>{lesson.focus}</small>
                  {attempt && <span className="score-chip">{attempt.score} 分・{attempt.minutes} 分鐘</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel section report-section" id="profile">
          <div className="section-heading">
            <div><small className="muted">PERSONAL INTELLIGENCE</small><h2>我的學習報告</h2></div>
            <div className="report-actions">
              <button className="secondary-button" onClick={exportPersonalCsv}>匯出 CSV</button>
              <button className="secondary-button" onClick={() => window.print()}>列印／存成 PDF</button>
            </div>
          </div>
          <div className="report-stat-grid">
            <div className="stat-card"><b>{completed.length}</b><span>結案天數</span></div>
            <div className="stat-card"><b>{averageScore}%</b><span>平均正確率</span></div>
            <div className="stat-card"><b>{totalMinutes}</b><span>累積分鐘</span></div>
            <div className="stat-card"><b>{xp}</b><span>搜查經驗值</span></div>
          </div>
          <h3 className="badge-title">已取得徽章</h3>
          <div className="badge-grid">
            {badgeCatalog.map((badge) => {
              const earned = earnedBadges.some((item) => item.id === badge.id);
              return (
                <div className={`badge-card ${earned ? "earned" : "locked"}`} key={badge.id}>
                  <span>{earned ? badge.icon : "?"}</span><b>{badge.name}</b><small>{earned ? "已解鎖" : `完成 ${badge.threshold} 天解鎖`}</small>
                </div>
              );
            })}
          </div>
          <p className="muted family-link">
            需要家長查看進度？<a href="/family">前往家長連結中心 →</a>
          </p>
        </section>
      </main>

      <footer className="footer">
        日語推理研究所・原創語言學習企劃<br />
        城市、角色與案件皆為原創設定，不使用任何既有作品的角色、標誌或故事。
      </footer>

      {activeLesson && content && (
        <div className="lesson-overlay" role="presentation">
          <section className="lesson-dialog expanded-dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
            <div className="dialog-top">
              <div>
                <span className="eyebrow">CASE {String(activeLesson.day).padStart(2, "0")}・{content.level}</span>
                <h2 id="lesson-title" className="dialog-title">{activeLesson.title}</h2>
                <p className="muted">今日任務：{activeLesson.mission}</p>
              </div>
              <button className="close-button" onClick={() => setActiveLesson(null)} aria-label="關閉課程">×</button>
            </div>

            <div className="step-tabs" role="tablist" aria-label="課堂進度">
              {lessonSteps.map((step, index) => (
                <button className={activeStep === index ? "current" : ""} onClick={() => setActiveStep(index)} role="tab" aria-selected={activeStep === index} key={step}>
                  <span>{index + 1}</span>{step}
                </button>
              ))}
            </div>

            <div className="lesson-step-content">
              {activeStep === 0 && (
                <div className="briefing-grid">
                  <div className="clue-word">
                    <div><b lang="ja">{activeLesson.clue}</b>{romaji && <span className="romaji">{activeLesson.romaji}</span>}<p className="muted">{activeLesson.meaning}</p></div>
                    <button className="voice-button" onClick={() => speak(activeLesson.clue)} aria-label="播放日語發音">♪</button>
                  </div>
                  <div className="status-note"><b>案件目標</b><br />{activeLesson.mission}<br /><br /><b>預計時間</b><br />{isKanaLesson ? "簡報 5・筆順與紙筆 12・發音詞彙 8・聽辨 8・自習默寫 10・測驗結案 12 分鐘" : "簡報 5・詞彙 12・文法 10・聽力 10・自習 15・結案 5 分鐘"}</div>
                </div>
              )}

              {isKanaStep && (
                <KanaWritingLab day={activeLesson.day} signedIn={Boolean(user)} speak={speak} />
              )}

              {!isKanaStep && contentStep === 1 && (
                <>
                  <div className="step-heading"><div><small>VOCABULARY FILE</small><h3>今日 10 個核心詞彙</h3></div><button className="secondary-button" onClick={() => speak(content.vocabulary.map((item) => item[0]).join("。"), 0.72)}>連續播放</button></div>
                  <div className="vocab-grid">
                    {content.vocabulary.map(([japanese, reading, meaning]) => (
                      <button className="vocab-card" onClick={() => speak(japanese)} key={japanese}>
                        <b lang="ja">{japanese}</b>{romaji && <span>{reading}</span>}<small>{meaning}</small><i>♪</i>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {!isKanaStep && contentStep === 2 && (
                <div className="grammar-file">
                  <small>GRAMMAR ANALYSIS</small><h3>{content.grammar.title}</h3><p>{content.grammar.explanation}</p>
                  <div className="example-list">
                    {content.grammar.examples.map((example) => (
                      <button onClick={() => speak(example)} key={example}><span lang="ja">{example}</span><b>播放 ♪</b></button>
                    ))}
                  </div>
                  <div className="status-note">鑑識方法：圈出主題、框住助詞、在句尾標出時態，再用自己的詞替換一次。</div>
                </div>
              )}

              {!isKanaStep && contentStep === 3 && (
                <div className="listening-lab">
                  <small>LISTENING TESTIMONY</small><h3>先不看文字，連續聽兩次</h3>
                  <div className="listening-controls">
                    <button className="primary-button" onClick={() => speak(content.listeningScript, 0.65)}>慢速證詞</button>
                    <button className="primary-button" onClick={() => speak(content.listeningScript, 0.92)}>正常證詞</button>
                    <button className="secondary-button" onClick={() => speak(activeLesson.clue, 0.78)}>核心句跟讀</button>
                    {!recording ? (
                      <button className="secondary-button" onClick={startRecording}>● 錄下我的跟讀</button>
                    ) : (
                      <button className="secondary-button recording-button" onClick={stopRecording}>■ 停止錄音</button>
                    )}
                  </div>
                  {recordingUrl && <audio className="recording-playback" controls src={recordingUrl}>瀏覽器不支援錄音播放。</audio>}
                  <details><summary>聽完後顯示文字稿</summary><p lang="ja">{content.listeningScript}</p></details>
                  <div className="status-note">跟讀任務：每次播放後暫停，用相同節奏重複；第三次錄下自己的聲音並自行比較。</div>
                </div>
              )}

              {!isKanaStep && contentStep === 4 && (
                <div className="study-file">
                  <small>INDEPENDENT INVESTIGATION</small><h3>{isKanaLesson ? "10 分鐘紙筆默寫與自我檢查" : "15 分鐘獨立搜查"}</h3>
                  {isKanaLesson && <div className="status-note">紙筆任務：關閉答案提示後，由語音隨機聽寫；每字默寫 2 次，再把「還不熟／需要重練」的字各補寫 3 次。</div>}
                  <ol>{content.selfStudy.map((item) => <li key={item}>{item}</li>)}</ol>
                  <label>案件筆記（至少 20 字）
                    <textarea value={studyNote} onChange={(event) => setStudyNote(event.target.value)} rows={5} placeholder="記下不熟悉的線索、自己的例句，以及今天最容易出錯的地方……" />
                  </label>
                  <label>本次實際學習時間
                    <input type="number" min="15" max="90" value={studyMinutes} onChange={(event) => setStudyMinutes(Number(event.target.value))} /> 分鐘
                  </label>
                </div>
              )}

              {!isKanaStep && contentStep === 5 && (
                <div className="quiz-list">
                  <small>CLOSING EXAM</small><h3>五題全部完成後才可結案</h3>
                  {content.quizzes.map((quiz, quizIndex) => (
                    <fieldset className="quiz-card" key={quiz.id}>
                      <legend>{quizIndex + 1}. {quiz.prompt}</legend>
                      {quiz.audio && <button type="button" className="voice-button mini" onClick={() => speak(quiz.audio!)}>♪</button>}
                      <div className="quiz-options">
                        {quiz.options.map((option, index) => (
                          <label className={answers[quiz.id] === index ? "chosen" : ""} key={option}>
                            <input type="radio" name={quiz.id} checked={answers[quiz.id] === index} onChange={() => setAnswers((current) => ({ ...current, [quiz.id]: index }))} />
                            {option}
                          </label>
                        ))}
                      </div>
                      {answers[quiz.id] !== undefined && <p className={answers[quiz.id] === quiz.answer ? "answer-correct" : "answer-wrong"}>{answers[quiz.id] === quiz.answer ? "正確！" : "再檢查一次。"} {quiz.explanation}</p>}
                    </fieldset>
                  ))}
                </div>
              )}

              {!isKanaStep && contentStep === 6 && (
                <div className="closing-report">
                  <small>FINAL REPORT</small><h3>案件結案確認</h3>
                  <div className="report-stat-grid">
                    <div className="stat-card"><b>{Object.keys(answers).length}/5</b><span>已作答</span></div>
                    <div className="stat-card"><b>{studyNote.trim().length}</b><span>筆記字數</span></div>
                    <div className="stat-card"><b>{studyMinutes}</b><span>學習分鐘</span></div>
                    <div className="stat-card"><b>{content.level}</b><span>能力對照</span></div>
                  </div>
                  <div className="status-note">完成後將保存分數、學習時間、筆記與完成日期。登入使用者會同步到雲端並更新班級／家長報告。</div>
                  <button className="primary-button complete-button" onClick={completeLesson}>提交結案報告 ✓</button>
                </div>
              )}
            </div>

            {lessonMessage && <p className="lesson-message" aria-live="polite">{lessonMessage}</p>}
            <div className="dialog-actions">
              <button className="secondary-button" disabled={activeStep === 0} onClick={() => setActiveStep((step) => Math.max(0, step - 1))}>← 上一步</button>
              {activeStep < lessonSteps.length - 1 ? (
                <button className="primary-button" onClick={() => setActiveStep((step) => Math.min(lessonSteps.length - 1, step + 1))}>下一步 →</button>
              ) : (
                <button className="secondary-button" onClick={() => setActiveLesson(null)}>返回案件地圖</button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

function mergeOverride(base: ReturnType<typeof buildLessonContent>, payloadJson?: string) {
  if (!payloadJson) return base;
  try {
    const value = JSON.parse(payloadJson) as {
      vocabulary?: Array<[string, string, string]>;
      grammar?: { title?: string; explanation?: string; examples?: string[] };
      listening?: string;
      selfStudy?: string[];
    };
    return {
      ...base,
      vocabulary: Array.isArray(value.vocabulary) && value.vocabulary.length
        ? value.vocabulary.filter((item) => Array.isArray(item) && item.length === 3)
        : base.vocabulary,
      grammar: value.grammar
        ? {
            title: value.grammar.title ?? base.grammar.title,
            explanation: value.grammar.explanation ?? base.grammar.explanation,
            examples: value.grammar.examples?.length ? value.grammar.examples : base.grammar.examples,
          }
        : base.grammar,
      listeningScript: value.listening ?? base.listeningScript,
      selfStudy: value.selfStudy?.length ? value.selfStudy : base.selfStudy,
    };
  } catch {
    return base;
  }
}
