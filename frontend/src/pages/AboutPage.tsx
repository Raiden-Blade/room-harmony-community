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
        <article><span>01</span><h2>Coordinate</h2><p>36件すべて架空です。外部投稿画像は保存・再配布していません。</p></article>
        <article><span>02</span><h2>Product</h2><p>60件の`DEMO-*`参照です。商品名・価格・画像は機能検証用です。</p></article>
        <article><span>03</span><h2>Official action</h2><p>公式検索URLのみ外部へ開きます。在庫、Cart、購入完了は模倣しません。</p></article>
        <article><span>04</span><h2>Room Harmony</h2><p>Live接続はありません。選択商品のHandoff payloadだけをPreviewします。</p></article>
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
        <ul className="check-list check-list--muted"><li>Public投稿・Comment・Follow・ランキング</li><li>AI / LLMによる推薦</li><li>本物の価格・在庫・POS・決済</li><li>NITORI内部API・Room Harmony実接続</li><li>売上や併売率が改善したという表示</li></ul>
      </section>
    </div>
  );
}
