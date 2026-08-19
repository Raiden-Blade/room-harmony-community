export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`demo-notice${compact ? " demo-notice--compact" : ""}`} aria-label="デモデータについて">
      <strong>機能検証用デモ</strong>
      {!compact && (
        <span>主要画面の一部は使用許可を得たNITORI公式画像・商品情報の参照スナップショット、残りは架空のデモです。在庫、購入、公式推奨を示しません。</span>
      )}
    </aside>
  );
}
