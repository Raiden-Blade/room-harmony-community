import { Link } from "react-router-dom";

import type { CoordinateItem, ProductSummary } from "../../api/types";
import { dateStamp, label, yen } from "../../utils/labels";
import { Badge } from "../common/Badge";
import { SafeImage } from "../common/SafeImage";

type Props = { product: ProductSummary; item?: CoordinateItem; compact?: boolean };

export function ProductCard({ product, item, compact = false }: Props) {
  const isOfficialSnapshot = product.provenance === "NITORI_OFFICIAL_SNAPSHOT";
  return (
    <article className={`product-card${compact ? " product-card--compact" : ""}`}>
      <SafeImage
        src={product.image_url}
        fallbackSrc="/assets/product-fallback.svg"
        fallbackLabel={isOfficialSnapshot ? "商品参照画像を表示できないため、デモ画像を表示中" : "機能検証用の商品画像"}
        alt={`${product.name}の商品画像`}
        loading="lazy"
      />
      <div className="product-card__body">
        <div className="badge-row">
          <Badge tone="quiet">{label(item?.role || product.default_role)}</Badge>
          <Badge tone={isOfficialSnapshot ? "accent" : "warning"}>{isOfficialSnapshot ? "NITORI商品参照" : "機能検証商品"}</Badge>
          {item && <Badge>{label(item.source)}</Badge>}
          {item?.mutation_state && item.mutation_state !== "ORIGINAL" && <Badge tone="accent">{label(item.mutation_state)}</Badge>}
        </div>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <p className="price">{yen(product.price_snapshot)}</p>
        <p className="price-note">{isOfficialSnapshot ? "公式価格参照" : "架空デモ価格"} · {dateStamp(product.price_observed_at)}</p>
        <Link className="text-link" to={`/products/${product.id}`}>商品と使用コーデを見る</Link>
      </div>
    </article>
  );
}
