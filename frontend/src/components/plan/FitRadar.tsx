import { useId } from "react";

import type { FitAssessment } from "../../api/types";

const SIZE = 300;
const CENTER = 150;
const RADIUS = 84;
const LABEL_RADIUS = 118;

const SHORT_LABELS: Record<FitAssessment["axes"][number]["code"], string> = {
  BUDGET: "予算",
  NEEDS: "困りごと",
  EXISTING_FURNITURE: "手持ち家具",
  STYLE: "好み",
  COMPOSITION: "構成",
};

const FRIENDLY_LABELS: Record<FitAssessment["axes"][number]["code"], string> = {
  BUDGET: "予算との一致",
  NEEDS: "困りごとへの対応",
  EXISTING_FURNITURE: "手持ち家具との相性",
  STYLE: "好みとの一致",
  COMPOSITION: "商品役割のバランス",
};

function point(index: number, value: number, radius = RADIUS) {
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5);
  const scaled = radius * value / 100;
  return `${CENTER + Math.cos(angle) * scaled},${CENTER + Math.sin(angle) * scaled}`;
}

function labelPoint(index: number) {
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5);
  return {
    x: CENTER + Math.cos(angle) * LABEL_RADIUS,
    y: CENTER + Math.sin(angle) * LABEL_RADIUS,
  };
}

function fitTone(score: number) {
  if (score >= 85) return "希望にとても近い";
  if (score >= 70) return "希望にかなり近い";
  if (score >= 50) return "調整の余地がある";
  return "見直しポイントがある";
}

export function FitRadar({ fit }: { fit: FitAssessment }) {
  const titleId = useId();
  const descriptionId = useId();
  const polygon = fit.axes.map((axis, index) => point(index, axis.score ?? 0)).join(" ");
  const rings = [25, 50, 75, 100];
  return (
    <div className="fit-radar">
      <div className="fit-radar__heading">
        <div><p className="eyebrow">Match distribution</p><h3>希望との適合傾向</h3></div>
        <div className="fit-radar__overall"><strong>{fit.overall_score}</strong><small>/100</small><span>{fitTone(fit.overall_score)}</span></div>
      </div>
      <svg role="img" aria-labelledby={`${titleId} ${descriptionId}`} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <title id={titleId}>PLAN適合度 {fit.overall_score}点</title>
        <desc id={descriptionId}>予算、困りごと、手持ち家具、好み、構成の5軸。正解や美しさではなく、入力した希望との一致傾向です。</desc>
        {rings.map((ring) => <polygon key={ring} className="fit-radar__ring" points={fit.axes.map((_, index) => point(index, ring)).join(" ")} />)}
        {fit.axes.map((axis, index) => <line key={axis.code} className="fit-radar__axis" x1={CENTER} y1={CENTER} x2={point(index, 100).split(",")[0]} y2={point(index, 100).split(",")[1]} />)}
        <polygon className="fit-radar__value" points={polygon} />
        {fit.axes.map((axis, index) => {
          const position = labelPoint(index);
          return <text key={`${axis.code}-label`} className="fit-radar__label" x={position.x} y={position.y} textAnchor="middle">{SHORT_LABELS[axis.code]}</text>;
        })}
      </svg>
      <p className="fit-radar__note">正解や美しさの採点ではなく、入力条件との一致を示しています。</p>
      <details className="fit-evidence">
        <summary>評価の根拠を見る</summary>
        <dl className="fit-axis-list">
          {fit.axes.map((axis) => (
            <div key={axis.code}>
              <dt>{FRIENDLY_LABELS[axis.code]}</dt>
              <dd>
                <div className="fit-axis-list__score">
                  <strong>{axis.available ? axis.score : "--"}</strong>
                  <small>{axis.available ? `評価比重 ${axis.applied_weight}%` : "評価対象外"}</small>
                </div>
                {axis.evidence.length > 0 && <ul aria-label={`${FRIENDLY_LABELS[axis.code]}の判定根拠`}>
                  {axis.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>}
                <details>
                  <summary>判定方法</summary>
                  <p>{axis.reason}</p>
                </details>
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
