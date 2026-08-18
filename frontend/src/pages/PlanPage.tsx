import { Link, useParams } from "react-router-dom";

import { api } from "../api/client";
import { Badge } from "../components/common/Badge";
import { ErrorView, Loading } from "../components/common/StatusView";
import { ProductCard } from "../components/product/ProductCard";
import { useAsync } from "../hooks/useAsync";
import { dateStamp, label, yen } from "../utils/labels";

export function PlanPage() {
  const { planId = "" } = useParams();
  const plan = useAsync(() => api.plan(planId), [planId]);
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
        <img src={data.image_url} alt="PLANの元になったオリジナルデモイラスト" />
      </header>

      <section className="plan-summary" aria-label="PLANの要約">
        <div><span>購入候補の概算</span><strong>{yen(data.price.known_total)}</strong><small>{data.price.unknown_item_count}件の未取得価格 · 再計算: {dateStamp(data.price.calculated_at)}</small></div>
        <div><span>商品構成</span><strong>{data.product_count}商品</strong><small>{data.category_count}カテゴリ</small></div>
        <div><span>元のコーデ</span><strong>{data.parent_coordinate_id ? "派生PLAN" : "オリジナル"}</strong><small>変更履歴を保持</small></div>
      </section>

      <div className="plan-actions">
        <Link className="button button--primary" to={`/plans/${data.id}/edit`}>商品・手持ち家具を調整する</Link>
        <Link className="button button--secondary" to={`/plans/${data.id}/handoff`}>店舗で{data.product_count}商品を比較する</Link>
      </div>

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
