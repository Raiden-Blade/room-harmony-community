# Visual Asset Plan

## 目的と境界

Home、Explore、Seasonal、Challenge、Coordinate Detailで繰り返し見える主要15件を、同じ部屋画像の色替えだけに見えない状態へする。現在は権利安全な**自作SVG模式図**を使い、実在する部屋・商品・購入実績とは表示しない。第三者画像、NITORI商品写真、SNS投稿画像は同梱しない。

将来、許諾済みの実写または写実的な合成画像を入手した場合も、`Coordinate.image_url`を差し替えるだけでDomainやAPIを変更しない。候補ファイル名は予約であり、現時点のRepositoryには実画像を含めない。

## 主要15件の制作指示

| ID | 表示タイトル / 部屋 | 種別・手持ち家具 | Style・Need | 主な商品役割 | 現在の自作SVG | 将来の候補ファイル / 画づくり |
|---|---|---|---|---|---|---|
| coord-001 | ナチュラルで整える収納 / 6畳 | REAL・手持ちチェアあり | NATURAL・STORAGE | 主家具・収納・照明 | `room-scene-coord-001.svg` | `coord-001-storage-natural.webp` / 明るい木目、壁面収納、床の余白 |
| coord-002 | クリアクールで整える収納 / 5.5畳 | PLAN・なし | CLEAR_COOL・STORAGE | 主家具・収納・布 | `room-scene-coord-002.svg` | `coord-002-storage-clear-cool.webp` / 白とグレー、縦長収納 |
| coord-003 | ダンディで整える収納 / 6畳 | REAL・なし | DANDY・STORAGE | 主家具・収納・補助家具 | `room-scene-coord-003.svg` | `coord-003-storage-dandy.webp` / 濃色木目、低いベッド、隠す収納 |
| coord-004 | エレガントで整える収納 / 7〜8畳 | REAL・なし | ELEGANT・STORAGE | 主家具・収納・照明 | `room-scene-coord-004.svg` | `coord-004-storage-elegant.webp` / 柔らかな色、収納と装飾 |
| coord-005 | コージーで整える収納 / 6畳 | REAL・なし | COZY・STORAGE | 主家具・収納・布 | `room-scene-coord-005.svg` | `coord-005-storage-cozy.webp` / 布素材、かご収納、暖色照明 |
| coord-007 | 5万円前後のナチュラル / 6畳 | REAL・なし | NATURAL・LOW_BUDGET | 主家具・補助家具・照明 | `room-scene-coord-007.svg` | `coord-007-budget-natural.webp` / 必需品を絞った余白の多い部屋 |
| coord-008 | 5万円前後のクリアクール / 7〜8畳 | REAL・なし | CLEAR_COOL・LOW_BUDGET | 主家具・補助家具・布 | `room-scene-coord-008.svg` | `coord-008-budget-clear-cool.webp` / 少ない家具でも統一感 |
| coord-013 | ナチュラルな在宅作業 / 6畳 | REAL・なし | NATURAL・WORK_FROM_HOME | デスク・照明・収納 | `room-scene-coord-013.svg` | `coord-013-work-natural.webp` / 窓際デスク、仕事と睡眠の区分 |
| coord-014 | クリアクールな在宅作業 / 5.5畳 | PLAN・なし | CLEAR_COOL・WORK_FROM_HOME | デスク・照明・収納 | `room-scene-coord-014.svg` | `coord-014-work-clear-cool.webp` / 省スペースデスク、整理した配線 |
| coord-015 | ダンディな在宅作業 / 6畳 | REAL・なし | DANDY・WORK_FROM_HOME | デスク・照明・収納 | `room-scene-coord-015.svg` | `coord-015-work-dandy.webp` / 濃色デスク、集中できる作業角 |
| coord-019 | ナチュラルなくつろぎ / 6畳 | REAL・なし | NATURAL・RELAX | 主家具・補助家具・布 | `room-scene-coord-019.svg` | `coord-019-relax-natural.webp` / 低いソファ、ラグ、視線の抜け |
| coord-021 | ダンディなくつろぎ / 6畳 | REAL・手持ちチェアあり | DANDY・RELAX | 主家具・補助家具・照明 | `room-scene-coord-021.svg` | `coord-021-relax-dandy.webp` / 低座面、濃色、夜の間接照明 |
| coord-023 | コージーなくつろぎ / 6畳 | REAL・なし | COZY・RELAX | 主家具・補助家具・布 | `room-scene-coord-023.svg` | `coord-023-relax-cozy.webp` / クッションと布素材の重なり |
| coord-025 | ナチュラルな睡眠 / 6畳 | REAL・なし | NATURAL・SLEEP | 主家具・照明・布 | `room-scene-coord-025.svg` | `coord-025-sleep-natural.webp` / ベッド中心、遮光と手元灯 |
| coord-031 | 広く使うナチュラル / 6畳 | REAL・手持ちチェアあり | NATURAL・COMPACT | 主家具・収納・補助家具 | `room-scene-coord-031.svg` | `coord-031-compact-natural.webp` / 折りたたみ家具、通路の余白 |

Machine-readableな対応、権利状態、fallback、layout variantは[`data/seed/visual_asset_manifest.json`](../../data/seed/visual_asset_manifest.json)をSource of Truthとする。

## 差し替え条件

1. 画像ごとの権利根拠を記録し、`LOCALLY_CREATED_DEMO`、`CC0`、`EXPLICITLY_PERMITTED`のいずれかを満たす。
2. 顔、住所、郵便物、車のナンバーなどの個人情報が写っていないことを確認する。
3. 主要商品の役割とNeedが画像から読み取れ、タイトルだけを変えた重複画像にしない。
4. 16:10前後、最低1200×750、WebPを推奨し、各画像の容量を抑える。
5. 壊れた画像は`/assets/room-fallback.svg`へ切り替わることをBrowser QAで確認する。
6. `python scripts/validate_data/validate_seed.py`、Frontend build、mobile / tablet / desktop visual QAを通す。

## 現在の制約

- SVGは配置差を説明する模式図で、商品写真としての魅力や実寸を保証しない。
- 将来ファイル名は制作・許諾のBacklogであり、「写実画像が完成済み」という意味ではない。
- 画像の改善だけで購買率、併売率、投稿率が上がるとは主張しない。正式評価にはExposureと行動指標の設計が別途必要である。
