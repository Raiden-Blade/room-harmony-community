import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { api, trackOnce } from "../api/client";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
import { Badge } from "../components/common/Badge";
import { ErrorView, Loading } from "../components/common/StatusView";
import { useAsync } from "../hooks/useAsync";

export function CreatorProfilePage() {
  const { creatorId = "me" } = useParams();
  const profile = useAsync(
    () => creatorId === "me" ? api.creatorMe() : api.creator(creatorId),
    [creatorId],
  );

  useEffect(() => {
    if (!profile.data) return;
    trackOnce(`creator-profile-view:${profile.data.id}`, "creator_profile_view", { properties: { placement: "CREATOR_PROFILE" } });
    trackOnce(`creator-impact-view:${profile.data.id}`, "creator_impact_view", { properties: { placement: "CREATOR_PROFILE" } });
  }, [profile.data?.id]);

  if (profile.loading) return <Loading />;
  if (profile.error || !profile.data) {
    return (
      <div className="page-shell">
        <ErrorView message={profile.error || "Creator Profileが見つかりません"} />
        {creatorId === "me" && <Link className="button button--primary" to="/create">表示名をつくって投稿する</Link>}
      </div>
    );
  }
  const data = profile.data;
  const metrics = [
    ["公開コーデ", data.impact.published_coordinates, "公開中のREAL / PLAN"],
    ["参考になった", data.impact.helpful_count, "現在押している固有Session"],
    ["保存", data.impact.saved_count, "現在保存されている件数"],
    ["PLAN開始", data.impact.plan_started_count, "この投稿から直接作られたPrivate PLAN"],
    ["公開アレンジ", data.impact.public_adaptation_count, "公開された派生コーデ"],
    ["REAL ROOM", data.impact.real_room_contributions, "User申告の実在空間"],
  ] as const;

  return (
    <div className="page-shell creator-page">
      <header className="creator-header">
        <div className="creator-avatar" aria-hidden="true">{data.display_name.slice(0, 1)}</div>
        <div>
          <p className="eyebrow">クリエイターの貢献 · デモ表示名</p>
          <h1>{data.display_name}</h1>
          <p>{data.bio || "暮らしの条件と工夫を共有しています。"}</p>
          <small>表示名のみのデモアカウントです。本人確認済みではありません。</small>
        </div>
        {data.is_owner && <Link className="button button--primary" to="/create">新しいコーデをつくる</Link>}
      </header>

      <section className="impact-section" aria-labelledby="impact-title">
        <div className="section-heading"><div><p className="eyebrow">役立ちの記録</p><h2 id="impact-title">誰かの暮らしに役立った記録</h2></div><p>フォロワーや人気順位ではなく、参考・保存・再利用を数えます。</p></div>
        <div className="impact-grid">
          {metrics.map(([name, value, help]) => <article key={name}><strong>{value}</strong><span>{name}</span><small>{help}</small></article>)}
        </div>
      </section>

      <section className="creator-seasonal-section" aria-labelledby="creator-seasonal-title">
        <div className="section-heading"><div><p className="eyebrow">季節テーマへの貢献</p><h2 id="creator-seasonal-title">今年の新生活ユーザーの参考へ</h2></div><p>人気順位ではなく、テーマ参加・デモ選定・直接の派生を現在のデモDBから表示します。</p></div>
        <div className="creator-seasonal-summary">
          <article><strong>{data.seasonal.challenge_entries}</strong><span>テーマ参加</span></article>
          <article><strong>{data.seasonal.recognized_coordinates}</strong><span>Prototype Pick</span></article>
          <article><strong>{data.seasonal.direct_seasonal_reuse_count}</strong><span>直接の派生</span><small>参加コーデから1世代だけ</small></article>
        </div>
        {data.seasonal.participations.length > 0 ? <div className="creator-participations">{data.seasonal.participations.map((participation) => <article key={`${participation.challenge_id}-${participation.coordinate_id}`}><div><Badge tone="accent">{participation.season} {participation.year}</Badge>{participation.recognition && <Badge tone="warning">PROTOTYPE PICK</Badge>}</div><Link to={`/challenges/${participation.challenge_slug}`}>{participation.challenge_title} →</Link><small><Link to={`/coordinates/${participation.coordinate_id}`}>{participation.coordinate_title}</Link></small></article>)}</div> : <p className="empty-card">季節テーマへの参加はまだありません。<br />{data.is_owner ? <Link to="/seasonal">参加できるテーマを見る →</Link> : <Link to="/seasonal">季節テーマを見る →</Link>}</p>}
      </section>

      <section className="section section--flush" aria-labelledby="contributions-title">
        <div className="section-heading"><div><p className="eyebrow">Contribution history</p><h2 id="contributions-title">公開中の暮らし</h2></div><p>{data.contribution_count}件。非公開にした投稿は表示しません。</p></div>
        {data.contributions.length ? <div className="coordinate-grid coordinate-grid--three">{data.contributions.map((coordinate) => <CoordinateCard key={coordinate.id} coordinate={coordinate} />)}</div> : <p className="empty-card">公開中のコーデはまだありません。<br />{data.is_owner ? <Link to="/create">最初のコーデをつくる →</Link> : <Link to="/explore">ほかのコーデを探す →</Link>}</p>}
      </section>
    </div>
  );
}
