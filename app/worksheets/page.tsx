import Link from "next/link";
import PrintButton from "../components/PrintButton";
import { kanaByDay, kanaStrokes } from "../data/kana-strokes";

export default async function WorksheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const day = Math.max(1, Math.min(12, Math.trunc(Number(params.day) || 1)));
  const dayKana = kanaByDay[day] ?? [];

  return (
    <main className="worksheet-page">
      <header className="worksheet-toolbar">
        <div><span className="eyebrow">PRINTABLE CASE FILE</span><h1>五十音紙筆練習單・DAY {day}</h1></div>
        <nav>
          <Link href="/">返回課程</Link>
          <PrintButton />
        </nav>
      </header>
      <section className="worksheet-info">
        <span>姓名：________________</span><span>日期：________________</span>
        <p>練習方式：看筆順寫 3 次，遮住範例默寫 2 次，最後圈出最需要重練的一個字。</p>
      </section>
      <section className="worksheet-grid">
        {dayKana.map((kana) => (
          <article className="worksheet-card" key={kana}>
            <div className="worksheet-model">
              <svg viewBox="0 0 109 109" aria-label={`${kana} 的筆順`}>
                {kanaStrokes[kana]?.paths.map((path, index) => <path d={path} key={index} />)}
                {kanaStrokes[kana]?.labels.map(([x, y, number]) => (
                  <g key={number}><circle cx={x} cy={y - 3} r="6.5" /><text x={x} y={y - 0.5}>{number}</text></g>
                ))}
              </svg>
            </div>
            {[1, 2, 3, 4, 5].map((number) => <div className="worksheet-blank" key={number}><span>{number}</span></div>)}
            <footer><b lang="ja">{kana}</b><span>{kanaStrokes[kana]?.paths.length ?? 0} 畫</span><label>□ 待複習</label></footer>
          </article>
        ))}
      </section>
      <footer className="worksheet-footer">
        日語推理研究所・筆順資料 KanjiVG（Ulrich Apel 與貢獻者）CC BY-SA 3.0
      </footer>
    </main>
  );
}
