"use client";

import { useEffect, useMemo, useState } from "react";
import { confusingPairs, kanaByDay, kanaStrokes } from "../data/kana-strokes";

type Rating = "smooth" | "review" | "retry";
type RatingMap = Record<string, Rating>;

const localKey = "jpll-kana-writing-v1";
const ratingLabels: Record<Rating, string> = {
  smooth: "寫得順",
  review: "還不熟",
  retry: "需要重練",
};

const specialTips: Record<string, string> = {
  き: "橫畫要分清楚，最後的曲線不要和上半部擠在一起。",
  さ: "留意第二筆與最後一筆的位置，避免寫成「き」。",
  ぬ: "先確認內圈與收筆方向，避免和「め」混淆。",
  め: "交叉後的圓弧要完整，收筆不要多繞一圈。",
  れ: "第一筆短直，第二筆從左側開始轉折。",
  ね: "右下需要形成圓環，和「れ、わ」比較後再寫。",
  シ: "兩個短點偏橫向，長筆由下往右上。",
  ツ: "兩個短點偏直向，長筆起點比「シ」更高。",
  ソ: "短點與長筆的方向一致，留意長筆從上方落下。",
  ン: "短點較橫，長筆由左下往右上，和「ソ」成對比較。",
};

export default function KanaWritingLab({
  day,
  signedIn,
  speak,
}: {
  day: number;
  signedIn: boolean;
  speak: (text: string, rate?: number) => void;
}) {
  const dayKana = kanaByDay[day] ?? [];
  const [selected, setSelected] = useState(dayKana[0] ?? "あ");
  const [visibleStrokes, setVisibleStrokes] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [dictation, setDictation] = useState(false);
  const [answerVisible, setAnswerVisible] = useState(true);
  const [seconds, setSeconds] = useState(75);
  const [timerRunning, setTimerRunning] = useState(false);
  const [ratings, setRatings] = useState<RatingMap>({});
  const stroke = kanaStrokes[selected];

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      try {
        setRatings(JSON.parse(localStorage.getItem(localKey) ?? "{}") as RatingMap);
      } catch {
        setRatings({});
      }
    }, 0);
    if (signedIn) {
      void fetch("/api/kana")
        .then((response) => response.ok ? response.json() : null)
        .then((data: { records?: Array<{ kana: string; rating: Rating }> } | null) => {
          if (!data?.records) return;
          setRatings((current) => ({
            ...current,
            ...Object.fromEntries(data.records.map((item) => [item.kana, item.rating])),
          }));
        });
    }
    return () => window.clearTimeout(hydrateTimer);
  }, [signedIn]);

  useEffect(() => {
    if (!playing || !stroke) return;
    const timer = window.setInterval(() => {
      setVisibleStrokes((current) => {
        if (current >= stroke.paths.length) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, stroke]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  const relatedPairs = useMemo(
    () => confusingPairs.filter((pair) => pair.includes(selected as never)),
    [selected],
  );
  const reviewCount = dayKana.filter((kana) => ratings[kana] === "review" || ratings[kana] === "retry").length;

  function chooseKana(kana: string) {
    setSelected(kana);
    setVisibleStrokes(1);
    setPlaying(false);
    setDictation(false);
    setAnswerVisible(true);
    setSeconds(75);
    setTimerRunning(false);
  }

  function playAll() {
    setAnswerVisible(true);
    setVisibleStrokes(1);
    setPlaying(true);
  }

  function startDictation() {
    setDictation(true);
    setAnswerVisible(false);
    setPlaying(false);
    speak(selected, 0.72);
    setSeconds(45);
    setTimerRunning(true);
  }

  async function rate(rating: Rating) {
    const next = { ...ratings, [selected]: rating };
    setRatings(next);
    localStorage.setItem(localKey, JSON.stringify(next));
    if (signedIn) {
      await fetch("/api/kana", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kana: selected, day, rating }),
      }).catch(() => null);
    }
  }

  return (
    <div className="kana-lab">
      <div className="step-heading">
        <div><small>KANA FORM LAB</small><h3>字形鑑識室・紙筆練習</h3></div>
        <div className="kana-lab-actions">
          <button className="secondary-button" onClick={() => window.open(`/worksheets?day=${day}`, "_blank")}>列印練習單</button>
          <button className="secondary-button" onClick={() => speak(selected)}>聽發音 ♪</button>
        </div>
      </div>

      <div className="kana-selector" aria-label="選擇今天的假名">
        {dayKana.map((kana) => (
          <button
            className={`${selected === kana ? "selected" : ""} ${ratings[kana] ?? ""}`}
            onClick={() => chooseKana(kana)}
            key={kana}
          >
            <span lang="ja">{kana}</span>
            <small>{ratings[kana] ? ratingLabels[ratings[kana]] : `${kanaStrokes[kana]?.paths.length ?? 0} 畫`}</small>
          </button>
        ))}
      </div>

      <div className="kana-workspace">
        <section className={`stroke-stage ${!answerVisible ? "answer-hidden" : ""}`} aria-label={`${selected} 的筆順示範`}>
          <div className="practice-grid" />
          {answerVisible ? (
            <svg viewBox="0 0 109 109" role="img" aria-label={`${selected}，共 ${stroke?.paths.length ?? 0} 畫`}>
              {stroke?.paths.map((path, index) => (
                <path
                  className={index + 1 === visibleStrokes && playing ? "drawing" : ""}
                  d={path}
                  key={`${selected}-${index}`}
                  pathLength="1"
                  style={{ opacity: index < visibleStrokes ? 1 : 0.08 }}
                />
              ))}
              {stroke?.labels.slice(0, visibleStrokes).map(([x, y, number]) => (
                <g key={`label-${number}`}>
                  <circle cx={x} cy={y - 3} r="6.5" />
                  <text x={x} y={y - 0.5}>{number}</text>
                </g>
              ))}
            </svg>
          ) : (
            <div className="dictation-mask"><b>請在紙上寫出聽到的假名</b><span>完成後再顯示答案</span></div>
          )}
        </section>

        <aside className="paper-coach">
          <span className="eyebrow">{dictation ? "聽寫模式" : `${stroke?.paths.length ?? 0} 畫・逐筆示範`}</span>
          <h4>{dictation ? "先聽，不看答案" : "看一次，紙上跟寫三次"}</h4>
          <div className="stroke-controls">
            {!dictation && <button className="primary-button" onClick={playAll}>▶ 慢速播放</button>}
            {!dictation && <button className="secondary-button" onClick={() => { setPlaying(false); setVisibleStrokes((value) => Math.min(stroke?.paths.length ?? 1, value + 1)); }}>下一筆</button>}
            <button className="secondary-button" onClick={startDictation}>♪ 隨機聽寫</button>
          </div>
          <div className="paper-timer">
            <b>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</b>
            <span>紙筆練習倒數</span>
            <button onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? "暫停" : "開始"}</button>
            <button onClick={() => { setSeconds(75); setTimerRunning(false); }}>重設</button>
          </div>
          {!answerVisible && <button className="primary-button reveal-answer" onClick={() => { setAnswerVisible(true); setDictation(false); setTimerRunning(false); }}>顯示答案與筆順</button>}
        </aside>
      </div>

      <div className="self-check-grid">
        <section className="check-card">
          <h4>紙上完成後自我檢查</h4>
          <label><input type="checkbox" /> 筆畫數和畫面相同</label>
          <label><input type="checkbox" /> 起筆位置與方向正確</label>
          <label><input type="checkbox" /> 字形落在格線中央</label>
          <label><input type="checkbox" /> 大小及留白比例接近範例</label>
        </section>
        <section className="check-card">
          <h4>本字提醒</h4>
          <p>{specialTips[selected] ?? "先看完整示範，再注意每一筆的起點、方向與收筆位置。"}</p>
          {relatedPairs.length > 0 && <p className="confusing-note">容易混淆：{relatedPairs.map((pair) => pair.join("／")).join("、")}</p>}
        </section>
      </div>

      <div className="rating-row">
        <div><b>這次紙筆書寫感覺如何？</b><span>{reviewCount ? `今天有 ${reviewCount} 個字待複習` : "完成後選擇一個狀態"}</span></div>
        {(["smooth", "review", "retry"] as Rating[]).map((rating) => (
          <button className={ratings[selected] === rating ? "selected" : ""} onClick={() => rate(rating)} key={rating}>{ratingLabels[rating]}</button>
        ))}
      </div>
      <p className="kana-credit">筆順資料：KanjiVG（Ulrich Apel 與貢獻者），依 CC BY-SA 3.0 使用。</p>
    </div>
  );
}
