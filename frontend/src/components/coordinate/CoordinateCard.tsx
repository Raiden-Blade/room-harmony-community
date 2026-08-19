import { Link } from "react-router-dom";

import { mediaUrl } from "../../api/client";
import type { CoordinateSummary } from "../../api/types";
import { coordinatePresentation, label, yen } from "../../utils/labels";
import { Badge } from "../common/Badge";
import { SafeImage } from "../common/SafeImage";

type Props = {
  coordinate: CoordinateSummary;
  detailQuery?: string;
  showMatchReasons?: boolean;
};

export function CoordinateCard({ coordinate, detailQuery = "", showMatchReasons = false }: Props) {
  const presentation = coordinatePresentation(coordinate);
  const detailHref = `/coordinates/${coordinate.id}${detailQuery ? `?${detailQuery}` : ""}`;
  return (
    <article className="coordinate-card">
      <Link className="coordinate-card__image" to={detailHref}>
        <SafeImage src={mediaUrl(coordinate.image_urls?.[0] || coordinate.image_url)} alt={`${coordinate.title}のコーデ画像`} fallbackLabel={presentation.fallbackLabel} />
        <div className="coordinate-card__badges">
          <Badge tone={presentation.tone}>{presentation.primary}</Badge>
          <Badge tone="warning">{presentation.secondary}</Badge>
        </div>
      </Link>
      <div className="coordinate-card__body">
        {showMatchReasons && coordinate.match_reasons.length > 0 && (
          <div className="reason-strip" aria-label="選んだ条件との一致">
            <span>選んだ条件との一致</span>
            <ul>
              {coordinate.match_reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        )}
        <p className="eyebrow">{label(coordinate.size_band)} · {label(coordinate.style)}</p>
        {coordinate.creator_id && <p className="coordinate-card__creator">by {coordinate.creator_display} · 参考になった {coordinate.helpful_count}</p>}
        <h3><Link to={detailHref}>{coordinate.title}</Link></h3>
        <p className="coordinate-card__description">{coordinate.description}</p>
        <div className="coordinate-card__meta">
          <span>{yen(coordinate.price.known_total)}目安</span>
          <span>{coordinate.product_count}商品 / {coordinate.category_count}カテゴリ</span>
        </div>
        <Link className="text-link" to={detailHref}>空間全体を見る <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}
