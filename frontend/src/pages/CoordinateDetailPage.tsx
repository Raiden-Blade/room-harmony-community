import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, mediaUrl, track, trackOnce } from "../api/client";
import { Badge } from "../components/common/Badge";
import { DemoNotice } from "../components/common/DemoNotice";
import { SafeImage } from "../components/common/SafeImage";
import { ErrorView, Loading } from "../components/common/StatusView";
import { ProductCard } from "../components/product/ProductCard";
import { useAsync } from "../hooks/useAsync";
import { label, yen } from "../utils/labels";

export function CoordinateDetailPage() {
  const { coordinateId = "" } = useParams();
  const navigate = useNavigate();
  const detail = useAsync(() => api.coordinate(coordinateId), [coordinateId]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("INAPPROPRIATE");
  const [reportDone, setReportDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (!detail.data) return;
    trackOnce(`coordinate-view:${detail.data.id}`, "coordinate_view", {
      coordinate_id: detail.data.id,
      properties: { product_count: detail.data.product_count, category_count: detail.data.category_count },
    });
    if (detail.data.match_reasons.length) {
      trackOnce(`match-reason-view:${detail.data.id}`, "match_reason_view", { coordinate_id: detail.data.id });
    }
    if (detail.data.challenge_contexts.length) {
      const context = detail.data.challenge_contexts[0];
      trackOnce(`challenge-coordinate-view:${context.challenge_id}:${detail.data.id}`, context.status === "ARCHIVED" ? "previous_year_coordinate_view" : "challenge_coordinate_view", {
        coordinate_id: detail.data.id,
        properties: { challenge_id: context.challenge_id, season: context.season },
      });
    }
  }, [detail.data?.id]);

  async function save() {
    if (!detail.data) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.save(detail.data.id);
      detail.setData({ ...detail.data, is_saved: true });
      await track("coordinate_save", { coordinate_id: detail.data.id });
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "保存できませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function createPlan() {
    if (!detail.data) return;
    setBusy(true);
    setActionError(null);
    try {
      const plan = await api.createPlan(detail.data.id, detail.data.budget_max);
      await track("adapt_start", { coordinate_id: detail.data.id });
      await track("plan_start", { coordinate_id: detail.data.id });
      await track("plan_from_coordinate", { coordinate_id: detail.data.id });
      if (detail.data.challenge_contexts[0]) {
        await track("challenge_adapt_start", {
          coordinate_id: detail.data.id,
          properties: {
            challenge_id: detail.data.challenge_contexts[0].challenge_id,
            season: detail.data.challenge_contexts[0].season,
          },
        });
      }
      navigate(`/plans/${plan.id}/edit`);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "PLANを作れませんでした");
      setBusy(false);
    }
  }

  async function toggleHelpful() {
    if (!detail.data) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = detail.data.is_helpful ? await api.unhelpful(detail.data.id) : await api.helpful(detail.data.id);
      detail.setData({ ...detail.data, is_helpful: result.helpful, helpful_count: result.helpful_count });
      await track(result.helpful ? "helpful_add" : "helpful_remove", { coordinate_id: detail.data.id });
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "参考になったを更新できませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function enterChallenge(challengeSlug: string, challengeId: string) {
    if (!detail.data) return;
    const option = detail.data.challenge_options.find((item) => item.challenge_slug === challengeSlug);
    setBusy(true);
    setActionError(null);
    await track("challenge_entry_start", {
      coordinate_id: detail.data.id,
      properties: {
        challenge_id: challengeId,
        challenge_type: option?.challenge_type || "LIFE_EVENT",
        season: option?.season || "SPRING",
      },
    });
    try {
      await api.enterChallenge(challengeSlug, detail.data.id);
      await track("challenge_entry_complete", {
        coordinate_id: detail.data.id,
        properties: { challenge_id: challengeId, challenge_type: option?.challenge_type || "LIFE_EVENT", season: option?.season || "SPRING" },
      });
      await detail.refresh();
    } catch (reason) {
      await track("challenge_entry_rejected", {
        coordinate_id: detail.data.id,
        properties: { challenge_id: challengeId, challenge_type: option?.challenge_type || "LIFE_EVENT", season: option?.season || "SPRING" },
      });
      setActionError(reason instanceof Error ? reason.message : "テーマに参加できませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    if (!detail.data) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.report(detail.data.id, reportReason);
      await track("content_report", { coordinate_id: detail.data.id, properties: { report_reason: reportReason } });
      setReportDone(true);
      setReportOpen(false);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "報告を送れませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!detail.data) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await api.editCoordinate(detail.data.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      detail.setData(updated);
      setEditing(false);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "投稿を編集できませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    if (!detail.data || !window.confirm("このコーデを非公開にしますか？派生関係は壊さず保持されます。")) return;
    setBusy(true);
    try {
      await api.unpublishCoordinate(detail.data.id);
      await track("coordinate_unpublish", { coordinate_id: detail.data.id });
      navigate("/creators/me");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "非公開にできませんでした");
      setBusy(false);
    }
  }

  if (detail.loading) return <Loading />;
  if (detail.error || !detail.data) return <ErrorView message={detail.error || "見つかりません"} />;
  const coordinate = detail.data;
  const imageRightsLabel = coordinate.image_rights === "USER_UPLOADED_LOCAL"
    ? "User upload / Local prototype保存"
    : coordinate.image_rights === "EXPLICITLY_PERMITTED"
      ? "使用許可を得たNITORI Coordinate参照画像（ローカル収録）"
      : "リポジトリ内のデモ画像";

  return (
    <div className="detail-page">
      <div className="detail-hero">
        <div className="detail-hero__image">
          <SafeImage src={mediaUrl(coordinate.image_urls?.[0] || coordinate.image_url)} alt={`${coordinate.title}の部屋・コーデ画像`} />
          <div className="coordinate-card__badges">
            <Badge tone={coordinate.kind === "REAL" ? "accent" : "quiet"}>{label(coordinate.kind)}</Badge>
            <Badge tone="warning">デモ</Badge>
          </div>
        </div>
        <div className="detail-hero__copy">
          <Link className="back-link" to="/explore">← 一覧へ戻る</Link>
          <p className="eyebrow">{label(coordinate.size_band)} · {label(coordinate.household)} · {label(coordinate.housing_type)}</p>
          {editing ? <div className="owner-edit"><label>タイトル<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={180} /></label><label>説明<textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={800} rows={4} /></label><div className="inline-actions"><button className="button button--primary" disabled={busy || !editTitle.trim()} onClick={() => void saveEdit()}>変更を保存</button><button className="button button--ghost" onClick={() => setEditing(false)}>キャンセル</button></div></div> : <><h1>{coordinate.title}</h1><p className="detail-lead">{coordinate.description}</p></>}
          {coordinate.creator_id && <p className="creator-byline">共有：<Link to={`/creators/${coordinate.creator_id}`}>{coordinate.creator_display} →</Link></p>}
          <div className="badge-row">
            {coordinate.needs.map((need) => <Badge key={need}>{label(need)}</Badge>)}
            <Badge>{label(coordinate.style)}</Badge>
          </div>
          <div className="price-panel">
            <div><span>購入候補の概算</span><strong>{yen(coordinate.price.known_total)}</strong></div>
            <div><span>空間の構成</span><strong>{coordinate.product_count}商品・{coordinate.category_count}カテゴリ</strong></div>
          </div>
          <p className="price-caveat">{coordinate.price.notice}{coordinate.price.unknown_item_count > 0 && ` 未取得価格 ${coordinate.price.unknown_item_count}件。`}</p>
          <div className="action-stack">
            <button className="button button--primary" disabled={busy} onClick={createPlan}>このコーデを自分向けにアレンジ</button>
            <button className="button button--ghost" disabled={busy || coordinate.is_saved} onClick={save}>
              {coordinate.is_saved ? "保存済み" : "あとで参考にする"}
            </button>
            <button className="button button--secondary" disabled={busy} aria-pressed={coordinate.is_helpful} onClick={() => void toggleHelpful()}>{coordinate.is_helpful ? "参考になったを取り消す" : "参考になった"} · {coordinate.helpful_count}</button>
          </div>
          <p className="intent-note">「参考になった」は役立ちの反応。「あとで参考にする」は自分の検討用保存です。</p>
          {coordinate.can_edit && <div className="owner-actions"><button onClick={() => { setEditTitle(coordinate.title); setEditDescription(coordinate.description); setEditing(true); }}>投稿を編集</button><button onClick={() => void unpublish()}>非公開にする</button></div>}
          {actionError && <p className="inline-error" role="alert">{actionError}</p>}
        </div>
      </div>

      <DemoNotice />

      {(coordinate.challenge_contexts.length > 0 || coordinate.challenge_options.length > 0) && (
        <section className="section detail-section coordinate-challenge-panel" aria-labelledby="coordinate-challenge-title">
          <div className="section-heading"><div><p className="eyebrow">季節とのつながり</p><h2 id="coordinate-challenge-title">この暮らしが参加するテーマ</h2></div><p>人気順位ではなく、季節と条件から再発見し、自分向けにアレンジします。</p></div>
          {coordinate.challenge_contexts.length > 0 && <div className="challenge-context-list">{coordinate.challenge_contexts.map((context) => <Link key={context.challenge_id} to={`/challenges/${context.challenge_slug}`}><span><Badge tone={context.status === "ACTIVE" ? "accent" : "quiet"}>{context.status === "ARCHIVED" ? "前年Archive" : "参加中"}</Badge>{context.recognition && <Badge tone="warning">PROTOTYPE PICK</Badge>}</span><strong>{context.challenge_title}</strong><small>{context.season} {context.year}{context.recognition && ` · ${label(context.recognition)}`}</small></Link>)}</div>}
          {coordinate.challenge_options.some((option) => !option.already_entered) && <div className="challenge-option-list"><h3>この投稿で参加できるテーマ</h3>{coordinate.challenge_options.filter((option) => !option.already_entered).map((option) => <article key={option.challenge_id}><div><strong>{option.challenge_title}</strong>{!option.eligible && <small>{option.rejection_messages.join(" ")}</small>}</div>{option.eligible ? <button className="button button--secondary" disabled={busy} onClick={() => void enterChallenge(option.challenge_slug, option.challenge_id)}>このテーマに参加</button> : <Badge tone="quiet">条件外</Badge>}</article>)}</div>}
        </section>
      )}

      {(coordinate.genealogy.parent || coordinate.genealogy.public_adaptation_count > 0 || coordinate.genealogy.plan_started_count > 0) && <section className="section detail-section lineage-panel" aria-labelledby="lineage-title"><div className="section-heading"><div><p className="eyebrow">Coordinate genealogy</p><h2 id="lineage-title">参考とアレンジのつながり</h2></div><p>巨大な人気グラフではなく、暮らしの再利用だけを示します。</p></div><div className="lineage-grid"><article><span>参考元</span>{coordinate.genealogy.parent ? coordinate.genealogy.parent.available && coordinate.genealogy.parent.id ? <Link to={`/coordinates/${coordinate.genealogy.parent.id}`}>{coordinate.genealogy.parent.title} →</Link> : <strong>{coordinate.genealogy.parent.title}</strong> : <strong>オリジナル</strong>}{coordinate.derivation_type && <small>{label(coordinate.derivation_type)}{coordinate.remix_note && ` · ${coordinate.remix_note}`}</small>}</article><article><span>Private PLAN</span><strong>{coordinate.genealogy.plan_started_count}件</strong><small>このコーデから直接検討を開始</small></article><article><span>公開アレンジ</span><strong>{coordinate.genealogy.public_adaptation_count}件</strong><small>Rootから生まれた公開コーデ</small></article></div>{coordinate.genealogy.public_children.length > 0 && <div className="lineage-children"><h3>公開中の直接アレンジ</h3>{coordinate.genealogy.public_children.map((child) => child.id && <Link key={child.id} to={`/coordinates/${child.id}`}>{child.title} →</Link>)}</div>}</section>}

      {coordinate.creator_id && <section className="section detail-section creator-impact-panel" aria-labelledby="creator-impact-title"><div><p className="eyebrow">Useful creator impact</p><h2 id="creator-impact-title">この暮らしが生んだ参考</h2><p>閲覧数ではなく、保存・PLAN・公開アレンジを表示します。</p></div><div className="impact-mini"><span><strong>{coordinate.creator_impact.helpful_count}</strong>参考になった</span><span><strong>{coordinate.creator_impact.saved_count}</strong>保存</span><span><strong>{coordinate.creator_impact.plan_started_count}</strong>PLAN開始</span><span><strong>{coordinate.creator_impact.public_adaptation_count}</strong>公開アレンジ</span></div><Link className="button button--secondary" to={`/creators/${coordinate.creator_id}`}>{coordinate.creator_display}のProfileへ</Link></section>}

      <section className="section detail-section" aria-labelledby="why-title">
        <div className="section-heading">
          <div><p className="eyebrow">Why it fits</p><h2 id="why-title">自分に近い理由</h2></div>
          <p>人気度ではなく、選んだ生活条件との一致です。</p>
        </div>
        <div className="reason-grid">
          {(coordinate.match_reasons.length ? coordinate.match_reasons : [label(coordinate.size_band), label(coordinate.housing_type), label(coordinate.style)]).map((reason, index) => (
            <div key={reason}><span>0{index + 1}</span><strong>{reason}</strong></div>
          ))}
        </div>
      </section>

      <section className="section detail-section" aria-labelledby="products-title">
        <div className="section-heading">
          <div><p className="eyebrow">Products in the space</p><h2 id="products-title">空間をつくる商品と役割</h2></div>
          <p>一つずつではなく、何のための商品かを確認できます。</p>
        </div>
        <div className="product-grid">
          {coordinate.items.filter((item) => item.product).map((item) => (
            <ProductCard key={item.id} product={item.product!} item={item} />
          ))}
        </div>
        {coordinate.items.some((item) => item.source === "EXISTING_EXTERNAL") && (
          <div className="existing-callout">
            <span aria-hidden="true">＋</span>
            <div><strong>手持ち家具も含む例</strong><p>{coordinate.items.filter((item) => item.source === "EXISTING_EXTERNAL").map((item) => item.existing_label).join("、")}</p></div>
          </div>
        )}
      </section>

      <section className="section trust-panel" aria-labelledby="trust-title">
        <div><p className="eyebrow">Trust & provenance</p><h2 id="trust-title">この事例について</h2></div>
        <dl>
          <div><dt>種別</dt><dd>{label(coordinate.kind)}</dd></div>
          <div><dt>コーデの出所</dt><dd>{label(coordinate.provenance)}（検証用構成）</dd></div>
          <div><dt>画像の扱い</dt><dd>{imageRightsLabel}</dd></div>
          <div><dt>確認状態</dt><dd>{label(coordinate.verification_state)}</dd></div>
        </dl>
        <p>{coordinate.demo_disclosure}</p>
        <div className="report-box"><button className="text-button" onClick={() => setReportOpen((value) => !value)}>{reportDone ? "報告を受け付けました" : "この投稿を報告"}</button>{reportOpen && !reportDone && <div><label>理由<select value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option value="INAPPROPRIATE">不適切</option><option value="PRIVACY">プライバシー</option><option value="MISLEADING">誤解を招く</option><option value="COPYRIGHT">著作権</option><option value="SPAM">スパム</option><option value="OTHER">その他</option></select></label><button className="button button--ghost" disabled={busy} onClick={() => void report()}>報告を送る</button><small>報告だけで自動削除はされません。</small></div>}</div>
      </section>
    </div>
  );
}
