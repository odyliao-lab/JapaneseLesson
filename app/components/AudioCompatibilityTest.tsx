"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Verdict = "yes" | "no" | "untested";
type RunState = "ready" | "running" | "started" | "ended" | "error";
type MethodId = "webaudio" | "htmlaudio" | "original" | "plain" | "delayed" | "voice";

type Method = {
  id: MethodId;
  label: string;
  title: string;
  description: string;
  expected: string;
};

const methods: Method[] = [
  { id: "webaudio", label: "A", title: "系統提示音・Web Audio", description: "播放短促的高低提示音，不使用日文語音。", expected: "聽到兩個電子提示音" },
  { id: "htmlaudio", label: "B", title: "音訊元件・HTML Audio", description: "建立一段 WAV 音訊再由瀏覽器播放器播放。", expected: "聽到一個短提示音" },
  { id: "original", label: "C", title: "目前課程的播放方式", description: "先取消既有語音，再立即呼叫日文語音合成。", expected: "聽到「あ、い、う、え、お」" },
  { id: "plain", label: "D", title: "不取消・直接播放", description: "不呼叫取消功能，直接送出一段日文語音。", expected: "聽到「あ、い、う、え、お」" },
  { id: "delayed", label: "E", title: "取消後延遲播放", description: "取消既有語音，等待 350 毫秒後再播放。", expected: "聽到「あ、い、う、え、お」" },
  { id: "voice", label: "F", title: "指定日文 Voice", description: "先讀取裝置語音清單，再明確指定一個 ja-JP 聲音。", expected: "聽到「あ、い、う、え、お」" },
];

const initialVerdicts = Object.fromEntries(methods.map((method) => [method.id, "untested"])) as Record<MethodId, Verdict>;
const initialRunStates = Object.fromEntries(methods.map((method) => [method.id, "ready"])) as Record<MethodId, RunState>;

export default function AudioCompatibilityTest() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [verdicts, setVerdicts] = useState(initialVerdicts);
  const [runStates, setRunStates] = useState(initialRunStates);
  const [details, setDetails] = useState<Record<MethodId, string>>(() => Object.fromEntries(methods.map((method) => [method.id, "尚未測試"])) as Record<MethodId, string>);
  const [copied, setCopied] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ userAgent: "讀取中", touchPoints: "讀取中", speech: "讀取中", testedAt: "讀取中" });
  const utterances = useRef<SpeechSynthesisUtterance[]>([]);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => {
      setDeviceInfo({
        userAgent: navigator.userAgent,
        touchPoints: String(navigator.maxTouchPoints),
        speech: "speechSynthesis" in window ? "支援" : "不支援",
        testedAt: new Date().toLocaleString("zh-TW"),
      });
      if ("speechSynthesis" in window) setVoices(window.speechSynthesis.getVoices());
    }, 0);
    if (!("speechSynthesis" in window)) return () => window.clearTimeout(hydrateTimer);
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.clearTimeout(hydrateTimer);
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      window.speechSynthesis.cancel();
      audioContext.current?.close().catch(() => undefined);
    };
  }, []);

  const japaneseVoices = useMemo(() => voices.filter((voice) => voice.lang.toLowerCase().startsWith("ja")), [voices]);

  function updateRun(id: MethodId, state: RunState, detail: string) {
    setRunStates((current) => ({ ...current, [id]: state }));
    setDetails((current) => ({ ...current, [id]: detail }));
  }

  async function run(method: MethodId) {
    setCopied(false);
    updateRun(method, "running", "正在嘗試播放…");
    try {
      if (method === "webaudio") return await playWebAudio(method);
      if (method === "htmlaudio") return await playHtmlAudio(method);
      await playSpeech(method);
    } catch (error) {
      updateRun(method, "error", error instanceof Error ? error.message : "播放時發生未知錯誤");
    }
  }

  async function playWebAudio(id: MethodId) {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) throw new Error("瀏覽器沒有提供 AudioContext");
    const context = audioContext.current ?? new AudioContextClass();
    audioContext.current = context;
    await context.resume();
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    gain.connect(context.destination);
    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(now + index * 0.25);
      oscillator.stop(now + index * 0.25 + 0.22);
    });
    updateRun(id, "started", `AudioContext：${context.state}`);
    window.setTimeout(() => updateRun(id, "ended", "提示音播放流程已完成"), 650);
  }

  async function playHtmlAudio(id: MethodId) {
    const url = createToneWavUrl();
    const audio = new Audio(url);
    audio.volume = 0.8;
    audio.onplay = () => updateRun(id, "started", "HTMLAudioElement 已開始播放");
    audio.onended = () => {
      updateRun(id, "ended", "音訊元件回報播放完成");
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => updateRun(id, "error", `音訊元件錯誤代碼：${audio.error?.code ?? "未知"}`);
    await audio.play();
  }

  async function playSpeech(id: Exclude<MethodId, "webaudio" | "htmlaudio">) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) throw new Error("瀏覽器不支援語音合成 API");
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance("あ、い、う、え、お");
    utterance.lang = "ja-JP";
    utterance.rate = 0.72;
    if (id === "voice") {
      const selectedVoice = japaneseVoices.find((voice) => voice.lang.toLowerCase() === "ja-jp") ?? japaneseVoices[0];
      if (!selectedVoice) throw new Error(`語音清單共有 ${voices.length} 個，但找不到日文 voice`);
      utterance.voice = selectedVoice;
    }
    utterance.onstart = () => updateRun(id, "started", `已開始；voice：${utterance.voice?.name ?? "由系統自動選擇"}`);
    utterance.onend = () => updateRun(id, "ended", "語音引擎回報播放完成");
    utterance.onerror = (event) => updateRun(id, "error", `語音錯誤：${event.error}`);
    utterances.current.push(utterance);
    utterances.current = utterances.current.slice(-8);

    if (id === "original") {
      synth.cancel();
      synth.speak(utterance);
    } else if (id === "delayed") {
      synth.cancel();
      window.setTimeout(() => synth.speak(utterance), 350);
    } else {
      synth.speak(utterance);
    }
  }

  function mark(id: MethodId, verdict: Exclude<Verdict, "untested">) {
    setVerdicts((current) => ({ ...current, [id]: verdict }));
  }

  function stopAll() {
    window.speechSynthesis?.cancel();
    setRunStates((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, value === "running" || value === "started" ? "ready" : value])) as Record<MethodId, RunState>);
  }

  const report = useMemo(() => {
    const voiceNames = japaneseVoices.map((voice) => `${voice.name} (${voice.lang}${voice.localService ? ", local" : ""})`).join("、") || "無";
    const resultLines = methods.map((method) => `${method.label}. ${method.title}：${verdictLabel(verdicts[method.id])}；系統狀態=${details[method.id]}`);
    return [
      "日語推理研究所｜平板語音測試結果",
      `時間：${deviceInfo.testedAt}`,
      `裝置：${deviceInfo.userAgent}`,
      `觸控點數：${deviceInfo.touchPoints}`,
      `SpeechSynthesis：${deviceInfo.speech}`,
      `全部 voices：${voices.length}`,
      `日文 voices：${voiceNames}`,
      ...resultLines,
    ].join("\n");
  }, [details, deviceInfo, japaneseVoices, verdicts, voices.length]);

  async function copyReport() {
    await navigator.clipboard.writeText(report);
    setCopied(true);
  }

  return (
    <>
      <section className="audio-device-grid" aria-label="裝置語音狀態">
        <div className="panel audio-device-card"><small>WEB SPEECH</small><b>{deviceInfo.speech}</b><span>瀏覽器語音 API</span></div>
        <div className="panel audio-device-card"><small>ALL VOICES</small><b>{voices.length}</b><span>裝置可用聲音</span></div>
        <div className="panel audio-device-card"><small>JAPANESE</small><b>{japaneseVoices.length}</b><span>{japaneseVoices[0]?.name ?? "尚未找到日文 voice"}</span></div>
      </section>

      <div className="audio-test-toolbar">
        <p>請一次只測一項，聽完再進行下一項。</p>
        <button className="secondary-button" type="button" onClick={stopAll}>停止所有聲音</button>
      </div>

      <section className="audio-method-list">
        {methods.map((method) => (
          <article className="panel audio-method-card" key={method.id}>
            <div className="audio-method-label">{method.label}</div>
            <div className="audio-method-copy">
              <h2>{method.title}</h2>
              <p>{method.description}</p>
              <small>應該聽到：{method.expected}</small>
              <div className={`audio-runtime ${runStates[method.id]}`} aria-live="polite">{details[method.id]}</div>
            </div>
            <div className="audio-method-actions">
              <button className="primary-button" type="button" onClick={() => void run(method.id)}>播放測試</button>
              <div className="audio-verdict" aria-label={`${method.title}的測試結果`}>
                <button className={verdicts[method.id] === "yes" ? "selected yes" : ""} type="button" onClick={() => mark(method.id, "yes")}>✓ 有聲音</button>
                <button className={verdicts[method.id] === "no" ? "selected no" : ""} type="button" onClick={() => mark(method.id, "no")}>× 沒有聲音</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="panel audio-report-card">
        <span className="eyebrow">DIAGNOSTIC REPORT</span>
        <h2>回傳測試結果</h2>
        <p>完成六項標記後複製結果，貼回給網站管理者。資料不會自動上傳。</p>
        <textarea aria-label="語音測試結果" readOnly value={report} />
        <button className="primary-button" type="button" onClick={() => void copyReport()}>{copied ? "已複製 ✓" : "複製測試結果"}</button>
      </section>
    </>
  );
}

function verdictLabel(verdict: Verdict) {
  if (verdict === "yes") return "有聲音";
  if (verdict === "no") return "沒有聲音";
  return "未標記";
}

function createToneWavUrl() {
  const sampleRate = 12000;
  const duration = 0.7;
  const samples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  write(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples * 2, true);
  for (let index = 0; index < samples; index += 1) {
    const envelope = Math.min(1, index / 180, (samples - index) / 480);
    const value = Math.sin(2 * Math.PI * 740 * index / sampleRate) * envelope * 0.45;
    view.setInt16(44 + index * 2, value * 0x7fff, true);
  }
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}
