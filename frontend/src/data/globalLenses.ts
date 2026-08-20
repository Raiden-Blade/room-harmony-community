export type GlobalLens = {
  code: string;
  country: string;
  english: string;
  cityHint: string;
  coordinateIds: [string, string, string, string];
};

export const globalLenses: GlobalLens[] = [
  { code: "JP", country: "日本", english: "Japan", cityHint: "Tokyo · Kumamoto", coordinateIds: ["coord-001", "coord-014", "coord-021", "coord-025"] },
  { code: "CN", country: "中国大陸", english: "China", cityHint: "Shanghai · Chengdu", coordinateIds: ["coord-002", "coord-019", "coord-004", "coord-031"] },
  { code: "TH", country: "タイ", english: "Thailand", cityHint: "Bangkok · Chiang Mai", coordinateIds: ["coord-004", "coord-007", "coord-023", "coord-015"] },
  { code: "MY", country: "マレーシア", english: "Malaysia", cityHint: "Kuala Lumpur", coordinateIds: ["coord-005", "coord-013", "coord-002", "coord-021"] },
  { code: "SG", country: "シンガポール", english: "Singapore", cityHint: "Singapore", coordinateIds: ["coord-007", "coord-031", "coord-014", "coord-019"] },
  { code: "AU", country: "オーストラリア", english: "Australia", cityHint: "Sydney · Melbourne", coordinateIds: ["coord-008", "coord-019", "coord-025", "coord-005"] },
  { code: "CA", country: "カナダ", english: "Canada", cityHint: "Vancouver · Toronto", coordinateIds: ["coord-013", "coord-023", "coord-003", "coord-025"] },
  { code: "US", country: "アメリカ", english: "United States", cityHint: "West Coast · East Coast", coordinateIds: ["coord-014", "coord-004", "coord-031", "coord-007"] },
  { code: "BR", country: "ブラジル", english: "Brazil", cityHint: "São Paulo", coordinateIds: ["coord-015", "coord-005", "coord-007", "coord-021"] },
  { code: "FR", country: "フランス", english: "France", cityHint: "Paris · Lyon", coordinateIds: ["coord-019", "coord-004", "coord-013", "coord-003"] },
  { code: "IT", country: "イタリア", english: "Italy", cityHint: "Milano · Roma", coordinateIds: ["coord-021", "coord-003", "coord-008", "coord-015"] },
  { code: "SE", country: "スウェーデン", english: "Sweden", cityHint: "Stockholm", coordinateIds: ["coord-023", "coord-025", "coord-001", "coord-031"] },
];

export const globalLensLabels = Object.fromEntries(globalLenses.map((lens) => [lens.code, lens.country]));

const coordinateAssetNames: Record<string, string> = {
  "coord-001": "coord-001-storage-natural.webp",
  "coord-002": "coord-002-storage-clear-cool.webp",
  "coord-003": "coord-003-storage-dandy.webp",
  "coord-004": "coord-004-storage-elegant.webp",
  "coord-005": "coord-005-storage-cozy.webp",
  "coord-007": "coord-007-budget-natural.webp",
  "coord-008": "coord-008-budget-clear-cool.webp",
  "coord-013": "coord-013-work-natural.webp",
  "coord-014": "coord-014-work-clear-cool.webp",
  "coord-015": "coord-015-work-dandy.webp",
  "coord-019": "coord-019-relax-natural.webp",
  "coord-021": "coord-021-relax-dandy.webp",
  "coord-023": "coord-023-relax-cozy.webp",
  "coord-025": "coord-025-sleep-natural.webp",
  "coord-031": "coord-031-compact-natural.webp",
};

export function coordinateAsset(coordinateId: string) {
  return `/assets/coordinates/nitori/${coordinateAssetNames[coordinateId]}`;
}
