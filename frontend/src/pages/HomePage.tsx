import { useEffect } from "react";
import { Link } from "react-router-dom";

import { api, trackOnce } from "../api/client";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
import { Loading } from "../components/common/StatusView";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { useAsync } from "../hooks/useAsync";

const quickEntries = [
  { label: "収納を増やしたい", icon: "▦", query: "room_size=SMALL_6&need=STORAGE&budget_max=50000" },
  { label: "5万円以内で揃えたい", icon: "¥", query: "room_size=SMALL_6&need=LOW_BUDGET&budget_max=50000" },
  { label: "デスク環境をつくりたい", icon: "□", query: "room_size=SMALL_6&need=WORK_FROM_HOME&budget_max=80000" },
];

export function HomePage() {
  const seasonal = useAsync(
    () => api.seasonal(),
    [],
  );

  useEffect(() => {
    trackOnce("session-start", "session_start");
    trackOnce("home-view", "home_view");
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">新生活 × 一人暮らし × 6畳</p>
          <h1>「好き」だけで終わらせず、<br />自分の部屋で試せるPLANへ。</h1>
          <p className="hero__lead">部屋・困りごと・予算の3つだけ。近い暮らしの事例から、必要な家具を空間ごとに考えられます。</p>
          <Link className="button button--primary" to="/explore?room_size=SMALL_6&need=STORAGE&budget_max=50000">
            6畳のおすすめを見る
          </Link>
          <p className="hero__microcopy">入力内容はデモ端末内の匿名Sessionでのみ使用します。</p>
        </div>
        <div className="hero__visual">
          <HeroCarousel />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="quick-start-title">
        <div className="section-heading">
          <div><p className="eyebrow">まず一つ選ぶ</p><h2 id="quick-start-title">今の困りごとから始める</h2></div>
          <p>最初から長い質問には答えなくて大丈夫です。</p>
        </div>
        <div className="quick-grid">
          {quickEntries.map((entry) => (
            <Link key={entry.label} className="quick-card" to={`/explore?${entry.query}`}>
              <span className="quick-card__icon" aria-hidden="true">{entry.icon}</span>
              <strong>{entry.label}</strong>
              <span>近い事例を見る →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--seasonal" aria-labelledby="seasonal-title">
        <div className="seasonal-story">
          <p className="eyebrow">Seasonal collection</p>
          <h2 id="seasonal-title">{seasonal.data?.featured?.title || "新生活の6畳"}</h2>
          <p>前年のREAL ROOM例を、今年の一人暮らしPLANへ。順位を競わず、実現に役立つ季節ごとの再利用として扱います。</p>
          <ol className="story-steps" aria-label="季節の循環">
            <li><span>01</span>前年のREAL例</li>
            <li><span>02</span>自分向けPLAN</li>
            <li><span>03</span>店舗・ECで確認</li>
          </ol>
          <Link className="button button--secondary" to="/seasonal">今のテーマと前年Archiveを見る</Link>
        </div>
        <div className="coordinate-grid coordinate-grid--three">
          {seasonal.loading && <Loading />}
          {seasonal.data?.previous_year_coordinates.slice(0, 3).map((coordinate) => <CoordinateCard key={coordinate.id} coordinate={coordinate} />)}
        </div>
      </section>

      <section className="section principle-strip" aria-label="このプロトタイプが大切にすること">
        <div><span>01</span><strong>事例から始める</strong><p>商品番号の前に暮らしを考える。</p></div>
        <div><span>02</span><strong>理由を見せる</strong><p>AIではなく条件一致を説明する。</p></div>
        <div><span>03</span><strong>手持ちも残す</strong><p>全部買い替えを前提にしない。</p></div>
      </section>
    </>
  );
}
