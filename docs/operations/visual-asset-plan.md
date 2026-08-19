# Visual Asset Plan

## 目的と境界

Final Demoで繰り返し見える主要15件を、使用許可を確認したNITORI公式のワンルームCoordinate参照画像へ置き換えた。収納、在宅作業、低予算、くつろぎ、睡眠、compactの違いを、タイトルだけでなく画像からも読み取れる状態にする。

- Source page: [新生活用品・お部屋別コーディネート](https://www.nitori-net.jp/ec/feature/newlifegoods/#room)
- Permission: User confirmed usage for this prototype. **一般的なOpen licenseではない**。
- Runtime: `frontend/public/assets/coordinates/nitori/`のlocal WebPだけを読む。Hotlinkしない。
- Data boundary: NITORI由来なのは室内参照画像のみ。Coordinate内容、`DEMO-*`商品、価格、商品画像、投稿者は架空またはRepository-original。
- User upload boundary: 利用者が投稿するREAL ROOM画像は`.demo/uploads/`へ別管理され、許可済み公式参照画像とは混在させない。
- Fallback: 既存の個別`room-scene-coord-*.svg`と共通`room-fallback.svg`を残す。

## 主要15件の確定Mapping

| ID | Demo上の役割 | Local NITORI WebP | 公式Source image | SVG fallback | 選定理由 |
|---|---|---|---|---|---|
| coord-001 | Similar / PLAN / 前年Archive / Product reverse | `coord-001-storage-natural.webp` | `room04-3_38w.jpg` | `room-scene-coord-001.svg` | 明るい木目とTV周りの収納 |
| coord-002 | Similar / Clear Cool収納 | `coord-002-storage-clear-cool.webp` | `room05-2_38w.jpg` | `room-scene-coord-002.svg` | 白いDeskと収納で省Space感 |
| coord-003 | Similar / 前年Archive / Dandy収納 | `coord-003-storage-dandy.webp` | `room03-3_38w.jpg` | `room-scene-coord-003.svg` | 濃色棚が収納Needを明示 |
| coord-004 | Similar / Elegant収納 | `coord-004-storage-elegant.webp` | `room02-4_38w.jpg` | `room-scene-coord-004.svg` | 白い収納と柔らかなPink |
| coord-005 | 前年Archive / Cozy収納 | `coord-005-storage-cozy.webp` | `room02-2_38w.jpg` | `room-scene-coord-005.svg` | 布の柔らかさと収納Bed |
| coord-007 | Similar / 5万円Theme | `coord-007-budget-natural.webp` | `room04-4_38w.jpg` | `room-scene-coord-007.svg` | 家具を絞った低いRelax構成 |
| coord-008 | Similar / Prototype Pick | `coord-008-budget-clear-cool.webp` | `room01-2_38w.jpg` | `room-scene-coord-008.svg` | Gray中心の簡潔な寝室 |
| coord-013 | Similar / Work / Seasonal | `coord-013-work-natural.webp` | `room04-2_38w.jpg` | `room-scene-coord-013.svg` | 木目Tableと生活Spaceの両立 |
| coord-014 | Similar / Work / Summer | `coord-014-work-clear-cool.webp` | `room05-4_38w.jpg` | `room-scene-coord-014.svg` | 白黒Deskを主役にした作業角 |
| coord-015 | Similar / Work / Product reverse | `coord-015-work-dandy.webp` | `room03-1_38w.jpg` | `room-scene-coord-015.svg` | 濃色DeskでDandyを強く差別化 |
| coord-019 | Current Challenge / Natural relax | `coord-019-relax-natural.webp` | `room01-4_38w.jpg` | `room-scene-coord-019.svg` | 低いGray Sofaと視線の抜け |
| coord-021 | Current Challenge / Dandy relax | `coord-021-relax-dandy.webp` | `room03-4_38w.jpg` | `room-scene-coord-021.svg` | 黒い低座家具とLow table |
| coord-023 | Current Challenge / Cozy relax | `coord-023-relax-cozy.webp` | `room02-1_38w.jpg` | `room-scene-coord-023.svg` | Pinkと布素材の暖かな全景 |
| coord-025 | Similar / Sleep | `coord-025-sleep-natural.webp` | `room04-1_38w.jpg` | `room-scene-coord-025.svg` | Bedを含むNaturalなRoom全景 |
| coord-031 | Existing furniture / Adapt / Product reverse | `coord-031-compact-natural.webp` | `room01-1_38w.jpg` | `room-scene-coord-031.svg` | Bed・Sofa・収納の使い分け |

個別の公式asset URL、Coordinate正式Title、権利状態、用途、選定理由は[`data/seed/visual_asset_manifest.json`](../../data/seed/visual_asset_manifest.json)をSource of Truthとする。

## Asset仕様と差し替え条件

1. Source取得時の650×414画像を中央基準で16:10へ最小Cropし、640×400 / WebP quality 84へ最適化する。
2. 15画像はすべて別Source viewを使い、同一fileの複製で差別化したように見せない。
3. 顔、氏名、住所、郵便物、車のNumber等の個人情報がないことを目視確認する。
4. `EXPLICITLY_PERMITTED`、`USER_CONFIRMED_FOR_THIS_PROTOTYPE`、Source URL、fallbackをmanifestに必須化する。
5. Card、Detail hero、Seasonal hero、Challenge cardは16:10を基準にし、`object-fit: cover`の過剰な見切れを避ける。
6. 壊れた画像は`SafeImage`により`/assets/room-fallback.svg`へ切り替える。個別SVGも将来の手動差し替え用に維持する。
7. `python scripts/validate_data/validate_seed.py`、Frontend build、390 / 768 / 1280のBrowser QAを通す。

## 現在の制約

- 公式参照画像と架空のCoordinate商品構成は1対1の実在商品対応を保証しない。画像から確認できる大きな用途・Styleの整合だけを取っている。
- 15件以外のCoordinateとHome heroはRepository-original SVGのままである。
- Product imageは今回の置換対象外であり、Repository-original demo-safe SVGを維持する。
- 画像改善だけで購買率、併売率、投稿率が上がるとは主張しない。正式評価にはExposure、比較条件、行動指標、購入Dataが必要である。
