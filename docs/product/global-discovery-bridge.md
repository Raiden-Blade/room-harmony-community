# Global Discovery Bridge

## 目的

起動時の`/`を、既存Application Homeとは独立した「普段の好みの外側へ視線を広げ、Room Harmonyの実行系へ渡す入口」にする。Global Home内へ商品一覧、条件Form、Seasonal、PLAN編集を再掲しない。

これは、国別の人気、各国の代表的インテリア、売上効果を示す機能ではない。現段階で検証する仮説は次の一つである。

> 条件入力の前に、探索距離の異なる空間を提示すると、検索だけでは開かれにくいCoordinateの詳細閲覧とPLAN開始が増える可能性がある。

効果は未検証であり、「併売率が上がる」「多様性が高まる」とはまだClaimしない。

## 画面から既存機能への接続

```text
Global Home
  ├─ 国・地域の探索ラベルを選ぶ
  │    └─ 「○○を深く見る」→ Explore（既存の条件一致結果）
  │         └─ Coordinate Detail → Private PLAN
  │              └─ 商品編集 / 2D配置 / AI Assist / Handoff Preview
  ├─ AI評価 → Saved（AI Intent説明）→ PLAN Edit / AI Assist
  ├─ MY PLAN → Saved / PLAN
  └─ コーディネートを投稿 → Create
```

`/`だけは`AppLayout`の外に置き、遷移後の`/explore`、`/saved`、`/create`などで既存のRoom Harmony Header / Navigationへ切り替える。Global Home専用の別商品、別PLAN、別APIは作らない。

## Global Homeが担当しないこと

- 商品Cardや検索Filterを同一画面へ積み上げない。
- AI Chat / 2D配置をGlobal Home内へ埋め込まない。
- 国名だけで商品を推薦したり、国別人気をClaimしたりしない。
- 入口の写真と遷移後の商品を、未確認の同一Roomセットとして扱わない。

## 国・地域ラベルの境界

12の国・地域名は探索UIのPrototype labelである。選択によってHero写真と遷移URLの`global_lens`だけが変わる。表示写真の撮影地、投稿者の居住地、商品の原産地、各国の代表Styleを意味しない。Exploreは`global_lens`を国別FilterとしてBackendへ送らず、現在保有する部屋・困りごと・予算の条件一致結果を表示し、その境界を画面に説明する。

現段階では、使用許可を確認済みの既存NITORI参照画像だけを使う。国別の主張を行うには、次の情報が必要である。

1. Coordinate単位のlocation / creator declarationと表示許可
2. データ取得日と出所
3. 誤登録訂正と公開範囲
4. 国別・地域別サンプル不足時の非表示ルール

## 計測

最小Funnelは次のEventで確認する。

1. `home_view`
2. `global_lens_select`（`global_lens`, `rank`, `placement=HOME`）
3. `coordinate_view`
4. `coordinate_save` / `plan_start`
5. `ai_assist_open`
6. `plan_ready` / `room_harmony_handoff_preview`

`global_lens_select`単体の増加は成功ではない。比較すべきなのは、Home閲覧SessionのうちCoordinate詳細、PLAN開始、Handoff Previewへ到達した割合と、同一Session内で閲覧したCoordinateのStyle / Need / Categoryの重複度である。

## 次段階で必要な検証

- 条件検索HomeとのA/Bまたは交互User test
- 初回利用者が「国名=撮影地」と誤解しないかの理解確認
- 期待外の提案が発見に見えるか、無関係に見えるかのInterview
- 表示国・言語・文化表現のreview
- 実商品の継続性、価格・在庫・店舗情報の正式API contract
