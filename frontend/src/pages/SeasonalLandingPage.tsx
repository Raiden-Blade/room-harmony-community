import { useEffect } from "react";
import { Link } from "react-router-dom";

import { api, track } from "../api/client";
import { ChallengeCard } from "../components/seasonal/ChallengeCard";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
import { DemoNotice } from "../components/common/DemoNotice";
import { ErrorView, Loading } from "../components/common/StatusView";
import { useAsync } from "../hooks/useAsync";


export function SeasonalLandingPage() {
  const landing = useAsync(() => api.seasonal(), []);

  useEffect(() => {
    void track("seasonal_landing_view", { properties: { placement: "SEASONAL" } });
  }, []);

  useEffect(() => {
    if (landing.data?.previous_year_coordinates.length) {
      void track("archive_view", { properties: { placement: "ARCHIVE" } });
    }
  }, [landing.data?.previous_year_coordinates.length]);

  if (landing.loading) return <Loading />;
  if (landing.error || !landing.data) return <ErrorView message={landing.error || "Seasonal Themeを読み込めません"} />;
  const data = landing.data;
  const activeThemes = data.active.filter((challenge) => challenge.challenge_type !== "CONSTRAINT");
  const upcomingThemes = data.upcoming.filter((challenge) => challenge.challenge_type !== "CONSTRAINT");

  return (
    <div className="page-shell seasonal-page">
      <header className="seasonal-hero">
        <div>
          <p className="eyebrow">{data.concept_label} · functional prototype</p>
          <h1>前年の暮らしを、<br />今年のPLANへ。</h1>
          <p>季節イベントの投稿数を競う場所ではありません。過去のREAL / PLANを見つけ、自分の条件へAdaptし、次年度の参考へ戻す循環を試します。</p>
          <div className="inline-actions">
            {data.featured && <Link className="button button--primary" to={`/challenges/${data.featured.slug}`}>今のテーマを見る</Link>}
            <a className="button button--ghost" href="#previous-year">昨年の参考コーデ</a>
          </div>
        </div>
        {data.featured && <img src={data.featured.cover_asset} alt="新生活6畳のSeasonal Growthを表すオリジナルデモイラスト" />}
      </header>

      <DemoNotice />

      <section className="seasonal-loop" aria-labelledby="seasonal-loop-title">
        <div><p className="eyebrow">Reuse, not contest</p><h2 id="seasonal-loop-title">Seasonal Growth Loop</h2></div>
        <ol>
          <li><span>01</span><strong>前年のREAL / PLAN</strong><small>Archiveから近い事例を探す</small></li>
          <li><span>02</span><strong>自分向けPLAN</strong><small>予算・広さ・手持ち家具へAdapt</small></li>
          <li><span>03</span><strong>Store / EC Action</strong><small>既存の行動導線で実現を検討</small></li>
          <li><span>04</span><strong>次年度へ戻す</strong><small>REAL / PLANを構造化して再共有</small></li>
        </ol>
      </section>

      <section className="section section--flush" aria-labelledby="active-themes-title">
        <div className="section-heading"><div><p className="eyebrow">Active themes</p><h2 id="active-themes-title">今、参加できるテーマ</h2></div><p>Popularity順位ではなく、暮らしの条件から選びます。</p></div>
        <div className="challenge-grid">{activeThemes.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}</div>
      </section>

      <section className="section section--flush" aria-labelledby="constraint-themes-title">
        <div className="section-heading"><div><p className="eyebrow">Constraint themes</p><h2 id="constraint-themes-title">制約から考える</h2></div><p>予算や商品点数を、free textではなく参加条件として確認します。</p></div>
        <div className="challenge-grid">{data.constraint_themes.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}</div>
      </section>

      {data.ended.length > 0 && (
        <section className="section section--flush" aria-labelledby="ended-themes-title">
          <div className="section-heading"><div><p className="eyebrow">Ended, before archive</p><h2 id="ended-themes-title">受付終了・整理中</h2></div><p>終了後も即時削除せず、次年度Archiveへ残す前の状態を明示します。</p></div>
          <div className="challenge-grid">{data.ended.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}</div>
        </section>
      )}

      <section id="previous-year" className="section section--archive" aria-labelledby="previous-year-title">
        <div className="section-heading"><div><p className="eyebrow">Previous year archive</p><h2 id="previous-year-title">昨年の参考コーデ</h2></div><p>保存だけで終わらず、そのままPrivate PLANへAdaptできます。</p></div>
        <div className="coordinate-grid coordinate-grid--three">{data.previous_year_coordinates.map((coordinate) => <CoordinateCard key={coordinate.id} coordinate={coordinate} />)}</div>
        {data.archived[0] && <Link className="button button--secondary archive-link" to={`/challenges/${data.archived[0].slug}`}>{data.archived[0].year} Archiveをすべて見る</Link>}
      </section>

      <section className="section section--flush" aria-labelledby="next-themes-title">
        <div className="section-heading"><div><p className="eyebrow">Next</p><h2 id="next-themes-title">これからのテーマ</h2></div><p>Spring専用にせず、Summer / Autumnにも同じDomainを使います。</p></div>
        <div className="challenge-grid">{upcomingThemes.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}</div>
      </section>
    </div>
  );
}
