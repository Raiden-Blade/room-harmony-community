import { ChangeEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, mediaUrl, track } from "../api/client";
import type { DerivationType, UploadedImage } from "../api/types";
import { Badge } from "../components/common/Badge";
import { SafeImage } from "../components/common/SafeImage";
import { ErrorView, Loading } from "../components/common/StatusView";
import { ProductCard } from "../components/product/ProductCard";
import { useAsync } from "../hooks/useAsync";
import { dateStamp, label, yen } from "../utils/labels";

export function PlanPage() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();
  const plan = useAsync(() => api.plan(planId), [planId]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [publishKind, setPublishKind] = useState<"PLAN" | "REAL">("PLAN");
  const [derivationType, setDerivationType] = useState<DerivationType>("OTHER");
  const [remixNote, setRemixNote] = useState("");
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void api.creatorMe().then((creator) => setDisplayName(creator.display_name)).catch(() => undefined);
  }, []);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setActionError(null);
    try {
      setUploaded(await api.uploadImage(file));
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "画像を処理できませんでした");
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  }

  async function publish() {
    if (!displayName.trim()) {
      setActionError("公開用の表示名を入力してください。");
      return;
    }
    if (publishKind === "REAL" && !uploaded) {
      setActionError("REAL ROOMとして共有するには部屋画像が必要です。");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await api.saveCreator(displayName.trim(), "");
      const coordinate = await api.publishPlan(
        planId,
        publishKind,
        derivationType,
        uploaded ? [uploaded.id] : [],
        remixNote.trim(),
      );
      await track(publishKind === "REAL" ? "real_room_publish" : "plan_publish", { coordinate_id: coordinate.id, properties: { kind: publishKind, derivation_type: derivationType } });
      await track("public_adaptation_publish", { coordinate_id: coordinate.id, properties: { kind: publishKind, derivation_type: derivationType } });
      navigate(`/coordinates/${coordinate.id}`);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "公開できませんでした");
      setBusy(false);
    }
  }
  if (plan.loading) return <Loading />;
  if (plan.error || !plan.data) return <ErrorView message={plan.error || "PLANが見つかりません"} />;
  const data = plan.data;

  return (
    <div className="page-shell plan-page">
      <Link className="back-link" to="/saved">← 保存・PLANへ</Link>
      <header className="plan-header">
        <div>
          <div className="badge-row"><Badge tone="quiet">PRIVATE PLAN</Badge><Badge tone="accent">{label(data.status)}</Badge><Badge tone="warning">デモ</Badge></div>
          <p className="eyebrow">{label(data.size_band)} · {label(data.household)} · {label(data.style)}</p>
          <h1>{data.title}</h1>
          <p>これは購入・在庫確保・専門家の設計承認を示さない、あなただけの検討用PLANです。</p>
        </div>
        <SafeImage src={data.image_url} alt="PLANの元になったオリジナルデモイラスト" />
      </header>

      <section className="plan-summary" aria-label="PLANの要約">
        <div><span>購入候補の概算</span><strong>{yen(data.price.known_total)}</strong><small>{data.price.unknown_item_count}件の未取得価格 · 再計算: {dateStamp(data.price.calculated_at)}</small></div>
        <div><span>商品構成</span><strong>{data.product_count}商品</strong><small>{data.category_count}カテゴリ</small></div>
        <div><span>元のコーデ</span><strong>{data.parent_coordinate_id ? "派生PLAN" : "オリジナル"}</strong><small>変更履歴を保持</small></div>
      </section>

      <div className="plan-actions">
        <Link className="button button--primary" to={`/plans/${data.id}/edit`}>商品・手持ち家具を調整する</Link>
        <Link className="button button--secondary" to={`/plans/${data.id}/handoff`}>店舗で{data.product_count}商品を比較する</Link>
        <button className="button button--ghost" onClick={() => setPublishOpen((value) => !value)}>公開コーデとして共有</button>
      </div>

      {publishOpen && <section className="publish-plan-panel" aria-labelledby="publish-plan-title"><div><p className="eyebrow">Re-share the adaptation</p><h2 id="publish-plan-title">このPLANを再共有する</h2><p>参考 → Private PLAN → 実現前のPLAN、または実現後のREAL ROOMとしてつなげます。</p></div><label>公開用の表示名<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} /></label><div className="kind-choice"><label className={publishKind === "PLAN" ? "is-selected" : ""}><input type="radio" checked={publishKind === "PLAN"} onChange={() => setPublishKind("PLAN")} /><strong>PLANとして共有</strong><span>まだ実現前。購入済みではありません。</span></label><label className={publishKind === "REAL" ? "is-selected" : ""}><input type="radio" checked={publishKind === "REAL"} onChange={() => setPublishKind("REAL")} /><strong>REAL ROOMとして共有</strong><span>実現後。部屋画像が必要です。</span></label></div><label>主な変更理由<select value={derivationType} onChange={(event) => setDerivationType(event.target.value as DerivationType)}><option value="LOWER_BUDGET">予算を抑えた</option><option value="SMALLER_ROOM">より小さい部屋向け</option><option value="COLOR_VARIATION">色を変えた</option><option value="STORAGE_FOCUS">収納を重視した</option><option value="EXISTING_FURNITURE">手持ち家具を活かした</option><option value="PRODUCT_SUBSTITUTION">商品を置き換えた</option><option value="OTHER">その他</option></select></label><label>変更の補足（任意）<input value={remixNote} onChange={(event) => setRemixNote(event.target.value)} maxLength={200} /></label>{publishKind === "REAL" && <div className="privacy-notice"><strong>投稿前のプライバシー確認</strong><p>顔・氏名・郵便物・住所・車のナンバーなど、個人情報が画像に写っていないことを自分で確認してください。</p></div>}{publishKind === "REAL" && <label className="upload-box">実現後の部屋画像を選ぶ<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event)} /></label>}{uploaded && <SafeImage className="single-upload-preview" src={mediaUrl(uploaded.url)} alt="公開する部屋画像のプレビュー" />}<p className="price-caveat">公開内容はUSER_DECLAREDで、NITORIや本システムによる実在性・購入・設計の確認済み情報ではありません。</p><button className="button button--primary" disabled={busy} onClick={() => void publish()}>{publishKind === "REAL" ? "REAL ROOMとして公開" : "PLANとして公開"}</button>{actionError && <p className="inline-error" role="alert">{actionError}</p>}</section>}

      <section className="section section--flush" aria-labelledby="plan-products-title">
        <div className="section-heading"><div><p className="eyebrow">Your selection</p><h2 id="plan-products-title">PLANの商品構成</h2></div></div>
        <div className="product-grid">
          {data.items.filter((item) => item.product).map((item) => <ProductCard key={item.id} product={item.product!} item={item} />)}
        </div>
        {data.items.filter((item) => item.source === "EXISTING_EXTERNAL").map((item) => (
          <div className="existing-callout" key={item.id}><span aria-hidden="true">＋</span><div><strong>{item.existing_label}</strong><p>{label(item.role)}{item.dimensions && ` · ${item.dimensions}`} · 購入額には含めません</p></div></div>
        ))}
      </section>
      <p className="price-caveat">{data.price.notice}</p>
    </div>
  );
}
