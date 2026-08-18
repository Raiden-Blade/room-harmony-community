import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { api, track } from "../api/client";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
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
    void track("creator_profile_view", { properties: { placement: "CREATOR_PROFILE" } });
    void track("creator_impact_view", { properties: { placement: "CREATOR_PROFILE" } });
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
          <p className="eyebrow">Creator impact · prototype identity</p>
          <h1>{data.display_name}</h1>
          <p>{data.bio || "暮らしの条件と工夫を共有しています。"}</p>
          <small>表示名のみのデモIdentityです。本人確認済みアカウントではありません。</small>
        </div>
        {data.is_owner && <Link className="button button--primary" to="/create">新しいコーデをつくる</Link>}
      </header>

      <section className="impact-section" aria-labelledby="impact-title">
        <div className="section-heading"><div><p className="eyebrow">Useful impact</p><h2 id="impact-title">誰かの暮らしに役立った記録</h2></div><p>Followerや人気順位ではなく、参考・保存・再利用を数えます。</p></div>
        <div className="impact-grid">
          {metrics.map(([name, value, help]) => <article key={name}><strong>{value}</strong><span>{name}</span><small>{help}</small></article>)}
        </div>
      </section>

      <section className="section section--flush" aria-labelledby="contributions-title">
        <div className="section-heading"><div><p className="eyebrow">Contribution history</p><h2 id="contributions-title">公開中の暮らし</h2></div><p>{data.contribution_count}件。非公開にした投稿は表示しません。</p></div>
        {data.contributions.length ? <div className="coordinate-grid coordinate-grid--three">{data.contributions.map((coordinate) => <CoordinateCard key={coordinate.id} coordinate={coordinate} />)}</div> : <p className="empty-card">公開中のコーデはまだありません。</p>}
      </section>
    </div>
  );
}
