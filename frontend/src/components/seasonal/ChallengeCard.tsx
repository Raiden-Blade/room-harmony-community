import { Link } from "react-router-dom";

import type { ChallengeSummary } from "../../api/types";
import { Badge } from "../common/Badge";
import { SafeImage } from "../common/SafeImage";
import { label } from "../../utils/labels";


const statusLabels = {
  UPCOMING: "まもなく開始",
  ACTIVE: "参加受付中",
  ENDED: "受付終了",
  ARCHIVED: "前年Archive",
} as const;

const typeLabels = {
  LIFE_EVENT: "暮らしの節目",
  CONSTRAINT: "条件から選ぶ",
  ADAPT_REMIX: "アレンジして再利用",
} as const;

export function ChallengeCard({ challenge }: { challenge: ChallengeSummary }) {
  return (
    <article className="challenge-card">
      <SafeImage src={challenge.cover_asset} alt="" />
      <div className="challenge-card__body">
        <div className="badge-row">
          <Badge tone={challenge.status === "ACTIVE" ? "accent" : "quiet"}>{statusLabels[challenge.status]}</Badge>
          <Badge>{label(challenge.season)} {challenge.year}</Badge>
          <Badge tone="warning">DEMO</Badge>
        </div>
        <p className="eyebrow">{typeLabels[challenge.challenge_type]}</p>
        <h3>{challenge.title}</h3>
        <p>{challenge.description}</p>
        <dl>
          <div><dt>条件</dt><dd>{challenge.constraint_summary || "共通条件なし"}</dd></div>
          <div><dt>{challenge.status === "ACTIVE" ? "参加中" : "掲載中"}</dt><dd>{challenge.entry_count}コーデ</dd></div>
        </dl>
        <Link className="button button--secondary" to={`/challenges/${challenge.slug}`}>テーマを見る</Link>
      </div>
    </article>
  );
}
