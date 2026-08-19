import type { FitAssessment } from "../../api/types";

const SIZE = 220;
const CENTER = 110;
const RADIUS = 70;

function point(index: number, value: number, radius = RADIUS) {
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5);
  const scaled = radius * value / 100;
  return `${CENTER + Math.cos(angle) * scaled},${CENTER + Math.sin(angle) * scaled}`;
}

export function FitRadar({ fit }: { fit: FitAssessment }) {
  const polygon = fit.axes.map((axis, index) => point(index, axis.score ?? 0)).join(" ");
  const rings = [25, 50, 75, 100];
  return (
    <div className="fit-radar">
      <svg role="img" aria-labelledby="fit-radar-title fit-radar-desc" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <title id="fit-radar-title">PLAN適合度 {fit.overall_score}点</title>
        <desc id="fit-radar-desc">予算、困りごと、手持ち家具、テイスト、構成の5軸。利用できない軸は0位置に表示し、下の一覧でダッシュとして示します。</desc>
        {rings.map((ring) => <polygon key={ring} className="fit-radar__ring" points={fit.axes.map((_, index) => point(index, ring)).join(" ")} />)}
        {fit.axes.map((axis, index) => <line key={axis.code} className="fit-radar__axis" x1={CENTER} y1={CENTER} x2={point(index, 100).split(",")[0]} y2={point(index, 100).split(",")[1]} />)}
        <polygon className="fit-radar__value" points={polygon} />
        <text className="fit-radar__score" x={CENTER} y={CENTER + 5} textAnchor="middle">{fit.overall_score}</text>
      </svg>
      <dl className="fit-axis-list">
        {fit.axes.map((axis) => (
          <div key={axis.code}>
            <dt>{axis.label}</dt>
            <dd><strong>{axis.available ? axis.score : "--"}</strong><span>{axis.reason}</span></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
