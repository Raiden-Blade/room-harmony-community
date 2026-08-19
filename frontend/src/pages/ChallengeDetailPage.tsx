import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, track, trackOnce } from "../api/client";
import { Badge } from "../components/common/Badge";
import { ErrorView, Loading } from "../components/common/StatusView";
import { SafeImage } from "../components/common/SafeImage";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
import { useAsync } from "../hooks/useAsync";
import { label } from "../utils/labels";


const statusText = {
  ACTIVE: "参加受付中",
  UPCOMING: "まもなく開始",
  ENDED: "受付終了・整理中",
  ARCHIVED: "前年Archive",
} as const;

const challengeTypeText = {
  LIFE_EVENT: "暮らしの節目",
  CONSTRAINT: "条件から選ぶ",
  ADAPT_REMIX: "アレンジして再利用",
} as const;

export function ChallengeDetailPage() {
  const { challengeSlug = "" } = useParams();
  const detail = useAsync(() => api.challenge(challengeSlug), [challengeSlug]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail.data) return;
    trackOnce(`challenge-view:${detail.data.id}`, "challenge_view", {
      properties: {
        challenge_id: detail.data.id,
        season: detail.data.season,
        challenge_type: detail.data.challenge_type,
        placement: detail.data.status === "ARCHIVED" ? "ARCHIVE" : "CHALLENGE",
      },
    });
    if (detail.data.status === "ARCHIVED") {
      trackOnce(`archive-view:${detail.data.id}`, "archive_view", { properties: { challenge_id: detail.data.id, season: detail.data.season } });
    }
    if (detail.data.prototype_picks.length) {
      trackOnce(`recognition-view:${detail.data.id}`, "recognition_view", {
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
      setMessage("このコーデでテーマに参加しました。参加数を更新しました。");
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
  if (detail.error || !detail.data) return <ErrorView message={detail.error || "テーマが見つかりません"} />;
  const data = detail.data;

  return (
    <div className="page-shell challenge-page">
      <Link className="back-link" to="/seasonal">← 季節テーマへ戻る</Link>
      <header className="challenge-hero">
        <SafeImage src={data.cover_asset} alt="" />
        <div>
          <div className="badge-row">
            <Badge tone={data.status === "ACTIVE" ? "accent" : "quiet"}>{statusText[data.status]}</Badge>
            <Badge>{label(data.season)} {data.year}</Badge>
            <Badge tone="warning">{data.year}年想定デモ</Badge>
          </div>
          <p className="eyebrow">{challengeTypeText[data.challenge_type]}</p>
          <h1>{data.title}</h1>
          <p className="detail-lead">{data.description}</p>
          <div className="inline-actions">
            {data.status === "ACTIVE" && <Link className="button button--primary" to={`/create?challenge=${data.slug}`}>このテーマでコーデをつくる</Link>}
            <a className="button button--ghost" href="#challenge-gallery">参考コーデを見る</a>
          </div>
          <small>NITORI公式企画・公式選定ではありません。受付状態と日付はデモ用データとして固定しています。</small>
        </div>
      </header>

      <section className="challenge-purpose" aria-labelledby="challenge-purpose-title">
        <div><p className="eyebrow">Why this matters</p><h2 id="challenge-purpose-title">このテーマを使う理由</h2></div>
        <p>{data.why_it_matters}</p>
      </section>

      <section className="challenge-facts" aria-label="テーマの参加状況">
        <article><strong>{data.participation_count}</strong><span>参加コーデ</span><small>現在のデモDBから集計</small></article>
        <article><strong>{data.real_count}</strong><span>REAL ROOM</span><small>ユーザー申告の投稿だけ</small></article>
        <article><strong>{data.plan_count}</strong><span>PLAN</span><small>購入済みではない</small></article>
      </section>

      <section className="section section--flush" aria-labelledby="constraints-title">
        <div className="section-heading"><div><p className="eyebrow">参加前に確認</p><h2 id="constraints-title">参加条件</h2></div><p>公開時には、画面と同じ条件をサーバー側でも確認します。</p></div>
        <ul className="constraint-list">{data.constraints.map((constraint) => <li key={constraint.code}><span aria-hidden="true">✓</span><strong>{constraint.label}</strong></li>)}</ul>
      </section>

      {data.status === "ACTIVE" && (
        <section className="entry-panel" aria-labelledby="entry-panel-title">
          <div><p className="eyebrow">公開済みコーデを活用</p><h2 id="entry-panel-title">自分の投稿で参加</h2><p>条件に合う公開済みのユーザー申告REAL ROOM / PLANから参加できます。</p></div>
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
          ) : <p className="empty-card">参加できる自分の公開コーデはまだありません。<Link to={`/create?challenge=${data.slug}`}>このテーマでつくる →</Link></p>}
          {message && <p className="success-message" role="status">{message}</p>}
          {error && <p className="inline-error" role="alert">{error}</p>}
        </section>
      )}

      {data.prototype_picks.length > 0 && (
        <section className="section section--flush" aria-labelledby="prototype-picks-title">
          <div className="section-heading"><div><p className="eyebrow">順位ではなく工夫を紹介</p><h2 id="prototype-picks-title">Prototype Pick</h2></div><p>デモ上の選定例です。似鳥社員による公式選定ではありません。</p></div>
          <div className="recognition-strip">{data.prototype_picks.map((entry) => <Link key={entry.id} to={`/coordinates/${entry.coordinate_id}`}><Badge tone="warning">PROTOTYPE PICK</Badge><strong>{entry.coordinate.title}</strong><span>{entry.recognition && label(entry.recognition)} →</span></Link>)}</div>
        </section>
      )}

      <section id="challenge-gallery" className="section section--flush" aria-labelledby="challenge-gallery-title">
        <div className="section-heading"><div><p className="eyebrow">テーマに合う事例</p><h2 id="challenge-gallery-title">このテーマの参考コーデ</h2></div><p>人気順位は付けず、参照画像・投稿PLAN・ユーザー申告REAL ROOMを区別します。</p></div>
        {data.entries.length ? <div className="coordinate-grid coordinate-grid--three">{data.entries.map((entry) => <div className="challenge-entry" key={entry.id}>{entry.recognition && <div className="challenge-entry__recognition"><Badge tone="warning">PROTOTYPE PICK</Badge><span>{label(entry.recognition)}</span></div>}<CoordinateCard coordinate={entry.coordinate} /></div>)}</div> : <p className="empty-card">公開中の参加コーデはまだありません。{data.status === "ACTIVE" && <><br /><Link to={`/create?challenge=${data.slug}`}>最初のコーデをつくる →</Link></>}</p>}
      </section>
    </div>
  );
}
