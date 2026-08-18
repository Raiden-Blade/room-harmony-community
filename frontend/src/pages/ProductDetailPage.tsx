import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, track, trackOnce } from "../api/client";
import { Badge } from "../components/common/Badge";
import { SafeImage } from "../components/common/SafeImage";
import { EmptyView, ErrorView, Loading } from "../components/common/StatusView";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
import { useAsync } from "../hooks/useAsync";
import { dateStamp, label, yen } from "../utils/labels";

export function ProductDetailPage() {
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const product = useAsync(() => api.product(productId), [productId]);

  useEffect(() => {
    if (!product.data) return;
    trackOnce(`product-view:${product.data.id}`, "product_view", {
      product_id: product.data.id,
      properties: { category: product.data.category, role: product.data.default_role },
    });
  }, [product.data?.id]);

  if (product.loading) return <Loading />;
  if (product.error || !product.data) return <ErrorView message={product.error || "商品が見つかりません"} />;
  const item = product.data;

  return (
    <div className="page-shell">
      <button className="back-link back-link--button" onClick={() => navigate(-1)}>← 前の画面へ戻る</button>
      <section className="product-detail">
        <div className="product-detail__image"><SafeImage src={item.image_url} fallbackSrc="/assets/product-fallback.svg" alt="オリジナルの商品プレースホルダー" /></div>
        <div className="product-detail__copy">
          <div className="badge-row"><Badge tone="warning">DEMO PRODUCT</Badge><Badge>{label(item.default_role)}</Badge></div>
          <p className="eyebrow">ID: {item.id}</p>
          <h1>{item.name}</h1>
          <p className="product-detail__price">{yen(item.price_snapshot)}</p>
          <p className="price-caveat">架空のデモ価格スナップショット（{dateStamp(item.price_observed_at)}）です。現在価格・在庫を示しません。</p>
          <a
            className="button button--secondary"
            href={item.official_url}
            target="_blank"
            rel="noreferrer"
            onClick={() => void track("ec_action", { product_id: item.id, properties: { destination: "NITORI_SEARCH" } })}
          >NITORI公式サイトで検索する ↗</a>
          <p className="external-note">外部の公式検索画面を新しいタブで開きます。Cartや購入は本デモに含まれません。</p>
        </div>
      </section>
      <section className="section" aria-labelledby="used-coordinates-title">
        <div className="section-heading">
          <div><p className="eyebrow">Product → Coordinate</p><h2 id="used-coordinates-title">この商品を使ったコーデを見る</h2></div>
          <p>単一商品から、同じ空間の別カテゴリ商品へ広げます。</p>
        </div>
        {item.coordinates.length === 0 ? <EmptyView title="この商品を使ったコーデはまだありません"><Link className="button button--secondary" to="/explore">別のコーデを探す</Link></EmptyView> : <div className="coordinate-grid coordinate-grid--three">
          {item.coordinates.slice(0, 6).map((coordinate) => (
            <div key={coordinate.id} onClick={() => void track("product_to_coordinate", { product_id: item.id, coordinate_id: coordinate.id })}>
              <CoordinateCard coordinate={coordinate} />
            </div>
          ))}
        </div>}
      </section>
    </div>
  );
}
