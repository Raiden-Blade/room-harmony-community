import { api } from "../api/client";
import { DemoNotice } from "../components/common/DemoNotice";
import { useAsync } from "../hooks/useAsync";

export function AboutPage() {
  const readiness = useAsync(() => api.readiness(), []);
  return (
    <div className="page-shell about-page">
      <header className="page-intro">
        <p className="eyebrow">About this prototype</p>
        <h1>何が本物で、何がデモか</h1>
        <p>判断材料の出所を隠さず、本番機能と誤認させないための説明です。</p>
      </header>
      <DemoNotice />
      <section className="about-grid">
        <article><span>01</span><h2>このデモで試せること</h2><p>近い暮らしを探し、保存し、自分向けPLANへ変え、店舗・公式サイトでの比較準備まで進めます。</p></article>
        <article><span>02</span><h2>コーデと部屋画像</h2><p>同梱36件はすべて架空で、部屋画像は自作SVGです。利用者が公開したREAL ROOMは本人申告で、公式確認済みではありません。</p></article>
        <article><span>03</span><h2>商品と並び順</h2><p>60件の`DEMO-*`参照です。商品名・価格・画像は機能検証用で、表示順は条件一致ルールによるものです。AI推薦ではありません。</p></article>
        <article><span>04</span><h2>画像アップロード</h2><p>JPEG・PNG・WebPをローカル保存し、再変換してEXIFを除去します。投稿者自身による個人情報確認も必要です。</p></article>
        <article><span>05</span><h2>季節テーマ</h2><p>Prototype Pickはデモ上の選定例で、NITORI公式選定ではありません。人気ランキングも設けていません。</p></article>
        <article><span>06</span><h2>Room Harmony</h2><p>実接続はありません。比較目的とデモ商品IDを含む連携データのプレビューだけを表示します。</p></article>
      </section>
      <section className="section section--flush" aria-labelledby="measurement-title">
        <div className="section-heading"><div><p className="eyebrow">Measurement readiness</p><h2 id="measurement-title">H1〜H3を計測可能にする</h2></div></div>
        <p className="price-caveat">現在のSimilar / PopularはUser自身が選ぶ表示条件です。Randomized A/B Testの割当ではなく、将来の比較検証に必要なEvent計測を準備しています。</p>
        <div className="measurement-grid">
          {Object.entries(readiness.data?.measurement_support || { H1: {}, H2: {}, H3: {} }).map(([key, values]) => (
            <article key={key}><strong>{key}</strong><p>{key === "H1" ? "Similar vs Popular → 商品探索" : key === "H2" ? "構造化Detail → 複数カテゴリ" : "Save → PLAN → Action"}</p><small>記録済みカウンタ合計: {Object.values(values).filter((value) => typeof value === "number").reduce((sum, value) => sum + Number(value), 0)}件</small></article>
          ))}
        </div>
        <p className="price-caveat">{readiness.data?.disclaimer || "Eventは操作後に蓄積されます。"}</p>
      </section>
      <section className="about-boundary">
        <h2>このMVPに含まれないもの</h2>
        <ul className="check-list check-list--muted"><li>コメント・フォロー・人気ランキング</li><li>AI / LLMによる推薦</li><li>本物の価格・在庫・POS・決済</li><li>NITORI内部API・Room Harmony実接続</li><li>売上・購入率・併売率が改善したという実証</li></ul>
      </section>
    </div>
  );
}
