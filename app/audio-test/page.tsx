import type { Metadata } from "next";
import Link from "next/link";
import AudioCompatibilityTest from "../components/AudioCompatibilityTest";

export const metadata: Metadata = {
  title: "平板語音相容性測試",
  description: "檢查平板瀏覽器的聲音輸出與日文語音合成功能。",
};

export default function AudioTestPage() {
  return (
    <div className="site-shell audio-test-shell">
      <header className="audio-test-header">
        <Link className="brand" href="/">
          <span className="brand-mark">音</span>
          <span><strong>平板語音鑑識室</strong><small>AUDIO COMPATIBILITY TEST</small></span>
        </Link>
        <Link className="secondary-button" href="/">返回課程</Link>
      </header>
      <main className="audio-test-wrap">
        <section className="panel audio-test-intro">
          <span className="eyebrow">TABLET AUDIO CHECK</span>
          <h1>哪一種播放方式有聲音？</h1>
          <p>請將平板音量調到一半，依序按下六個測試。每次播放結束後，標記「有聲音」或「沒有聲音」。測試文字都是「あ、い、う、え、お」。</p>
          <div className="audio-test-notice"><b>先確認：</b>關閉藍牙耳機或 AirPlay，並檢查瀏覽器分頁沒有被靜音。</div>
        </section>
        <AudioCompatibilityTest />
      </main>
    </div>
  );
}
