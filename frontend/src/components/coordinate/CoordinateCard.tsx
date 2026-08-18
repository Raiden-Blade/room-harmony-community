import { Link } from "react-router-dom";

import { mediaUrl } from "../../api/client";
import type { CoordinateSummary } from "../../api/types";
import { label, yen } from "../../utils/labels";
import { Badge } from "../common/Badge";

export function CoordinateCard({ coordinate }: { coordinate: CoordinateSummary }) {
  return (
    <article className="coordinate-card">
      <Link className="coordinate-card__image" to={`/coordinates/${coordinate.id}`}>
        <img src={mediaUrl(coordinate.image_urls?.[0] || coordinate.image_url)} alt={`${coordinate.title}のコーデ画像`} loading="lazy" />
        <div className="coordinate-card__badges">
          <Badge tone={coordinate.kind === "REAL" ? "accent" : "quiet"}>{label(coordinate.kind)}</Badge>
          <Badge tone="warning">デモ</Badge>
        </div>
      </Link>
      <div className="coordinate-card__body">
        {coordinate.match_reasons.length > 0 && (
          <div className="reason-strip" aria-label="あなたに近い理由">
            <span>あなたに近い理由</span>
            <ul>
              {coordinate.match_reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        )}
        <p className="eyebrow">{label(coordinate.size_band)} · {label(coordinate.style)}</p>
        {coordinate.creator_id && <p className="coordinate-card__creator">by {coordinate.creator_display} · 参考になった {coordinate.helpful_count}</p>}
        <h3><Link to={`/coordinates/${coordinate.id}`}>{coordinate.title}</Link></h3>
        <p className="coordinate-card__description">{coordinate.description}</p>
        <div className="coordinate-card__meta">
          <span>{yen(coordinate.price.known_total)}目安</span>
          <span>{coordinate.product_count}商品 / {coordinate.category_count}カテゴリ</span>
        </div>
        <Link className="text-link" to={`/coordinates/${coordinate.id}`}>空間全体を見る <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}
