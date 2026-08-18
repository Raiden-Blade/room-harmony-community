import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, track } from "../api/client";
import { Badge } from "../components/common/Badge";
import { ErrorView, Loading } from "../components/common/StatusView";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
import { useAsync } from "../hooks/useAsync";
import { label } from "../utils/labels";


const statusText = {
  ACTIVE: "参加受付中",
  UPCOMING: "まもなく開始",
  ENDED: "受付終了・整理中",
  ARCHIVED: "前年Archive",
} as const;

export function ChallengeDetailPage() {
  const { challengeSlug = "" } = useParams();
  const detail = useAsync(() => api.challenge(challengeSlug), [challengeSlug]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail.data) return;
    void track("challenge_view", {
      properties: {
        challenge_id: detail.data.id,
        season: detail.data.season,
        challenge_type: detail.data.challenge_type,
        placement: detail.data.status === "ARCHIVED" ? "ARCHIVE" : "CHALLENGE",
      },
    });
    if (detail.data.status === "ARCHIVED") {
      void track("archive_view", { properties: { challenge_id: detail.data.id, season: detail.data.season } });
    }
    if (detail.data.prototype_picks.length) {
      void track("recognition_view", {
        properties: {
          challenge_id: detail.data.id,
          season: detail.data.season,
          recognition: detail.data.prototype_picks[0].recognition ?? "SMART_BUDGET",
        },
      });
    }
  }, [detail.data?.id]);

  async function enter(coordinateId: string) {
    if (!detail.data) return;
    setBusyId(coordinateId);
    setError(null);
    setMessage(null);
    await track("challenge_entry_start", {
      coordinate_id: coordinateId,
      properties: { challenge_id: detail.data.id, season: detail.data.season, challenge_type: detail.data.challenge_type },
    });
    try {
      await api.enterChallenge(detail.data.slug, coordinateId);
      await track("challenge_entry_complete", {
        coordinate_id: coordinateId,
        properties: { challenge_id: detail.data.id, season: detail.data.season, challenge_type: detail.data.challenge_type },
      });
      setMessage("このCoordinateでテーマに参加しました。Entry countは実DBから更新されています。");
      await detail.refresh();
    } catch (reason) {
      await track("challenge_entry_rejected", {
        coordinate_id: coordinateId,
        properties: { challenge_id: detail.data.id, season: detail.data.season, challenge_type: detail.data.challenge_type },
      });
      setError(reason instanceof Error ? reason.message : "テーマに参加できませんでした");
    } finally {
      setBusyId(null);
    }
  }

  if (detail.loading) return <Loading />;
  if (detail.error || !detail.data) return <ErrorView message={detail.error || "Challengeが見つかりません"} />;
  const data = detail.data;

  return (
    <div className="page-shell challenge-page">
      <Link className="back-link" to="/seasonal">← Seasonalへ戻る</Link>
      <header className="challenge-hero">
        <img src={data.cover_asset} alt="" />
        <div>
          <div className="badge-row">
            <Badge tone={data.status === "ACTIVE" ? "accent" : "quiet"}>{statusText[data.status]}</Badge>
            <Badge>{data.season} {data.year}</Badge>
            <Badge tone="warning">DEMO CHALLENGE</Badge>
          </div>
          <p className="eyebrow">{data.challenge_type.replace("_", " / ")}</p>
          <h1>{data.title}</h1>
          <p className="detail-lead">{data.description}</p>
          <div className="inline-actions">
            {data.status === "ACTIVE" && <Link className="button button--primary" to={`/create?challenge=${data.slug}`}>このテーマでコーデをつくる</Link>}
            <a className="button button--ghost" href="#challenge-gallery">参考コーデを見る</a>
          </div>
          <small>NITORI公式Contest・公式選定ではなく、Seasonal Growthを検証するFunctional Prototypeです。</small>
        </div>
      </header>

      <section className="challenge-purpose" aria-labelledby="challenge-purpose-title">
        <div><p className="eyebrow">Why this matters</p><h2 id="challenge-purpose-title">このテーマを使う理由</h2></div>
        <p>{data.why_it_matters}</p>
      </section>

      <section className="challenge-facts" aria-label="テーマの参加状況">
        <article><strong>{data.participation_count}</strong><span>参加Coordinate</span><small>実Recordのみ</small></article>
        <article><strong>{data.real_count}</strong><span>REAL ROOM</span><small>User申告 / Demoを分離</small></article>
        <article><strong>{data.plan_count}</strong><span>PLAN</span><small>購入済みではない</small></article>
      </section>

      <section className="section section--flush" aria-labelledby="constraints-title">
        <div className="section-heading"><div><p className="eyebrow">Structured eligibility</p><h2 id="constraints-title">参加条件</h2></div><p>曖昧な説明文だけでなく、Serverが同じ条件を検証します。</p></div>
        <ul className="constraint-list">{data.constraints.map((constraint) => <li key={constraint.code}><span>{constraint.operator}</span><strong>{constraint.label}</strong></li>)}</ul>
      </section>

      {data.status === "ACTIVE" && (
        <section className="entry-panel" aria-labelledby="entry-panel-title">
          <div><p className="eyebrow">Use your existing Coordinate</p><h2 id="entry-panel-title">自分の投稿で参加</h2><p>新しい投稿Flowを複製せず、既存のPublic REAL / PLANをEntryにします。</p></div>
          {data.my_candidates.length ? (
            <div className="candidate-list">
              {data.my_candidates.map((candidate) => (
                <article key={candidate.coordinate.id}>
                  <div><strong>{candidate.coordinate.title}</strong><small>{label(candidate.coordinate.kind)} · {label(candidate.coordinate.size_band)}</small></div>
                  {candidate.already_entered ? <Badge tone="accent">参加済み</Badge> : candidate.eligible ? (
                    <button className="button button--secondary" disabled={busyId === candidate.coordinate.id} onClick={() => void enter(candidate.coordinate.id)}>このテーマに参加</button>
                  ) : <div className="candidate-reasons"><Badge tone="quiet">条件外</Badge><small>{candidate.rejection_messages.join(" ")}</small></div>}
                </article>
              ))}
            </div>
          ) : <p className="empty-card">参加できる自分のPublic Coordinateはまだありません。<Link to={`/create?challenge=${data.slug}`}>このテーマでつくる →</Link></p>}
          {message && <p className="success-message" role="status">{message}</p>}
          {error && <p className="inline-error" role="alert">{error}</p>}
        </section>
      )}

      {data.prototype_picks.length > 0 && (
        <section className="section section--flush" aria-labelledby="prototype-picks-title">
          <div className="section-heading"><div><p className="eyebrow">Recognition, not ranking</p><h2 id="prototype-picks-title">Prototype Pick</h2></div><p>実社員による公式選定ではなく、Demo上のControlled Recognitionです。</p></div>
          <div className="recognition-strip">{data.prototype_picks.map((entry) => <Link key={entry.id} to={`/coordinates/${entry.coordinate_id}`}><Badge tone="warning">PROTOTYPE PICK</Badge><strong>{entry.coordinate.title}</strong><span>{entry.recognition && label(entry.recognition)} →</span></Link>)}</div>
        </section>
      )}

      <section id="challenge-gallery" className="section section--flush" aria-labelledby="challenge-gallery-title">
        <div className="section-heading"><div><p className="eyebrow">Relevant examples</p><h2 id="challenge-gallery-title">このテーマの参考コーデ</h2></div><p>Global順位は付けず、REAL / PLANとRecognitionを明示します。</p></div>
        {data.entries.length ? <div className="coordinate-grid coordinate-grid--three">{data.entries.map((entry) => <div className="challenge-entry" key={entry.id}>{entry.recognition && <div className="challenge-entry__recognition"><Badge tone="warning">PROTOTYPE PICK</Badge><span>{label(entry.recognition)}</span></div>}<CoordinateCard coordinate={entry.coordinate} /></div>)}</div> : <p className="empty-card">公開中のEntryはまだありません。</p>}
      </section>
    </div>
  );
}
