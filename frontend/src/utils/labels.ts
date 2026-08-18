const LABELS: Record<string, string> = {
  PLAN: "PLAN（検討中）",
  REAL: "REAL ROOM",
  DEMO: "デモ制作",
  OFFICIAL: "公式想定デモ",
  STAFF: "スタッフ想定デモ",
  USER_DECLARED: "User申告",
  USER_DECLARED_UNVERIFIED: "User申告・未確認",
  DEMO_ONLY: "デモデータ・未確認",
  DEMO_UNVERIFIED: "デモデータ・未確認",
  ONE_ROOM: "1R / 1K",
  TINY_5_5: "5.5畳前後",
  SMALL_6: "6畳前後",
  MEDIUM_7_8: "7〜8畳",
  RENTAL: "賃貸",
  SINGLE: "一人暮らし",
  NATURAL: "ナチュラル",
  CLEAR_COOL: "クリアクール",
  DANDY: "ダンディ",
  ELEGANT: "エレガント",
  COZY: "コージー",
  COLORFUL: "カラフル",
  STORAGE: "収納",
  LOW_BUDGET: "低予算",
  WORK_FROM_HOME: "勉強・在宅作業",
  RELAX: "くつろぎ",
  SLEEP: "睡眠",
  COMPACT: "省スペース",
  MAIN_FURNITURE: "メイン家具",
  SUPPORT_FURNITURE: "サポート家具",
  LIGHTING: "照明",
  TEXTILE: "ファブリック",
  CATALOG_TO_BUY: "購入候補",
  CATALOG_OWNED: "所有済み",
  EXISTING_EXTERNAL: "手持ち家具",
  KEPT: "残す",
  REPLACED: "置換済み",
  ADDED: "追加",
  ORIGINAL: "元プラン",
  READY_FOR_ACTION: "比較準備OK",
  DRAFT: "編集中",
  LOWER_BUDGET: "予算を抑えた",
  SMALLER_ROOM: "より小さい部屋向け",
  COLOR_VARIATION: "色を変えた",
  STORAGE_FOCUS: "収納を重視した",
  EXISTING_FURNITURE: "手持ち家具を活かした",
  PRODUCT_SUBSTITUTION: "商品を置き換えた",
  OTHER: "その他",
  SPRING: "春",
  SUMMER: "夏",
  AUTUMN: "秋",
  WINTER: "冬",
  OFFICIAL_PICK: "Prototype選定",
  USEFUL_REUSE: "再利用の工夫",
  SMART_BUDGET: "予算の工夫",
  SMALL_SPACE_IDEA: "小さな部屋の工夫",
  REAL_ROOM_STORY: "REAL ROOMの工夫",
};

export function label(value: string): string {
  return LABELS[value] || value.replaceAll("_", " ");
}

export function yen(value: number | null): string {
  return value === null ? "価格情報なし" : `${new Intl.NumberFormat("ja-JP").format(value)}円`;
}

export function dateStamp(value: string | null): string {
  if (!value) return "取得日時なし";
  return `${new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value))}時点`;
}
