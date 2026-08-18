import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, track } from "../api/client";
import { Badge } from "../components/common/Badge";
import { DemoNotice } from "../components/common/DemoNotice";
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

  useEffect(() => {
    if (!detail.data) return;
    void track("coordinate_view", {
      coordinate_id: detail.data.id,
      properties: { product_count: detail.data.product_count, category_count: detail.data.category_count },
    });
    if (detail.data.match_reasons.length) {
      void track("match_reason_view", { coordinate_id: detail.data.id });
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
      await track("plan_start", { coordinate_id: detail.data.id });
      navigate(`/plans/${plan.id}/edit`);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "PLANを作れませんでした");
      setBusy(false);
    }
  }

  if (detail.loading) return <Loading />;
  if (detail.error || !detail.data) return <ErrorView message={detail.error || "見つかりません"} />;
  const coordinate = detail.data;

  return (
    <div className="detail-page">
      <div className="detail-hero">
        <div className="detail-hero__image">
          <img src={coordinate.image_url} alt={`${coordinate.title}のオリジナルデモイラスト`} />
          <div className="coordinate-card__badges">
            <Badge tone={coordinate.kind === "REAL" ? "accent" : "quiet"}>{label(coordinate.kind)}</Badge>
            <Badge tone="warning">デモ</Badge>
          </div>
        </div>
        <div className="detail-hero__copy">
          <Link className="back-link" to="/explore">← 一覧へ戻る</Link>
          <p className="eyebrow">{label(coordinate.size_band)} · {label(coordinate.household)} · {label(coordinate.housing_type)}</p>
          <h1>{coordinate.title}</h1>
          <p className="detail-lead">{coordinate.description}</p>
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
            <button className="button button--primary" disabled={busy} onClick={createPlan}>このコーデを参考にPLANを作る</button>
            <button className="button button--ghost" disabled={busy || coordinate.is_saved} onClick={save}>
              {coordinate.is_saved ? "保存済み" : "あとで参考にする"}
            </button>
          </div>
          {actionError && <p className="inline-error" role="alert">{actionError}</p>}
        </div>
      </div>

      <DemoNotice />

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
          <div><dt>出所モデル</dt><dd>{label(coordinate.provenance)}（すべてデモ）</dd></div>
          <div><dt>画像権利</dt><dd>リポジトリ内で制作したオリジナルSVG</dd></div>
          <div><dt>確認状態</dt><dd>{coordinate.verification_state}</dd></div>
        </dl>
        <p>{coordinate.demo_disclosure}</p>
      </section>
    </div>
  );
}
