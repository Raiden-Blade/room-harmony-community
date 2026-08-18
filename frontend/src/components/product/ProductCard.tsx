import { Link } from "react-router-dom";

import type { CoordinateItem, ProductSummary } from "../../api/types";
import { dateStamp, label, yen } from "../../utils/labels";
import { Badge } from "../common/Badge";

type Props = { product: ProductSummary; item?: CoordinateItem; compact?: boolean };

export function ProductCard({ product, item, compact = false }: Props) {
  return (
    <article className={`product-card${compact ? " product-card--compact" : ""}`}>
      <img src={product.image_url} alt="オリジナルの商品プレースホルダー" loading="lazy" />
      <div className="product-card__body">
        <div className="badge-row">
          <Badge tone="quiet">{label(item?.role || product.default_role)}</Badge>
          {item && <Badge>{label(item.source)}</Badge>}
          {item?.mutation_state && item.mutation_state !== "ORIGINAL" && <Badge tone="accent">{label(item.mutation_state)}</Badge>}
        </div>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <p className="price">{yen(product.price_snapshot)}</p>
        <p className="price-note">デモ価格スナップショット · {dateStamp(product.price_observed_at)}</p>
        <Link className="text-link" to={`/products/${product.id}`}>商品と使用コーデを見る</Link>
      </div>
    </article>
  );
}
