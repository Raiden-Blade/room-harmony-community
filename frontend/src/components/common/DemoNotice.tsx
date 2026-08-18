export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`demo-notice${compact ? " demo-notice--compact" : ""}`} aria-label="デモデータについて">
      <strong>機能検証用デモ</strong>
      {!compact && (
        <span>画像・商品・価格は架空のデモです。在庫、購入、専門家承認を示しません。</span>
      )}
    </aside>
  );
}
