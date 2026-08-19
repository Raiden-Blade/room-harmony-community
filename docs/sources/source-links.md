# Source Link Registry

最終確認日: 2026-08-19（JST）

本表は、内容を取得できなかった場合も URL 自体を消さない。`Retrieval status` は `VERIFIED`（到達・内容・目的の三点を確認）、`READ`（主要内容を読取）、`PARTIALLY_READ`（一部のみ読取）、`UNAVAILABLE`（今回の環境では取得不能）、`NOT_YET_VERIFIED`（未確認）のいずれかを使う。件数・在庫・価格等は変動するため、確認日を伴う観察値として扱う。

## NITORI official sources

| Source ID | Source name | URL | Source type | Purpose | Retrieval status | What it supports | Notes |
|---|---|---|---|---|---|---|---|
| NIT-001 | NITORI Coordinate Hub | https://www.nitori-net.jp/ec/feature/coordinate/?utm_source=digital_catalog&utm_medium=link&utm_campaign=digitalcatalog_top_coordinate_hub | NITORI official feature | Coordinate 関連機能の入口監査 | VERIFIED | Room 別導線、Staff / User Coordinate、関連サービス | 必須 Primary entry。ブラウザで動的表示まで確認。 |
| NIT-002 | みんなのインテリアコーディネート | https://www.nitori-net.jp/ec/userCoordinatelist/ | NITORI official list | User Coordinate の一覧・投稿元監査 | READ | Instagram ハッシュタグ由来、カテゴリ閲覧、投稿カード | 2026-08-18 観察時は全13,157件。件数は変動値。 |
| NIT-003 | スタッフのインテリアコーディネート | https://www.nitori-net.jp/ec/coordinatelist?coordinateType=none&label=nitori%2Cdecohome&orderBy=pv | NITORI official list | Staff Coordinate の一覧・分類・並び順監査 | READ | 人気順、カテゴリ、タグ、Staff / 店舗情報 | 2026-08-18 観察時は全12,392件。件数は変動値。 |
| NIT-004 | Staff Coordinate detail example | https://www.nitori-net.jp/ec/coordinate/38328 | NITORI official detail | Coordinate Detail の構造監査 | READ | 画像、説明、Room / Household、Tag、使用アイテム、価格、商品導線 | 個別例。全 Coordinate の仕様を代表すると断定しない。 |
| NIT-005 | User Coordinate detail example | https://www.nitori-net.jp/ec/userCoordinate?media=18027030434830264&user=domadoma993 | NITORI official detail | User Coordinate の構造監査 | READ | Instagram 原投稿・Account・Caption・使用アイテム | Native 投稿フォームや選定条件はこの画面から確認できない。 |
| NIT-006 | お部屋 de コーディネート | https://www.nitori-net.jp/ecstatic/front/simulation/tool/index.html | NITORI official simulation | 既存 Virtual Coordinate の範囲監査 | READ | Living / Bedroom / Dining、色選択、対象商品の組合せ、EC注文 | 固定画像ベースで、実物との差異に関する注意書きあり。 |
| NIT-007 | ニトリのインテリア相談 | https://www.nitori-net.jp/ec/characteristic/interior-onlineadviser/ | NITORI official service | Human adviser / planning 機能監査 | READ | 専門スタッフ、3D、レイアウト、見積、既存家財を含む提案、EC / 店舗注文 | 会員限定。相談対象や既存家財には条件あり。 |
| NIT-008 | ニトリアプリ | https://www.nitori-net.jp/ec/characteristic/App/ | NITORI official app feature | Store / EC / Coordinate assets の監査 | READ | 店舗在庫、フロアマップ、Store Mode、商品比較、User / Staff Coordinate | Community の Store Action はこの既存資産との連携前提にする。 |
| NIT-009 | 新生活特集2026 | https://www.nitori-net.jp/ec/feature/newlife/ | NITORI official seasonal feature | Seasonal content 監査 | READ | 一人暮らし、カテゴリ別準備、チェック、狭い部屋等の悩み | Editorial / campaign content として確認。 |
| NIT-010 | 新生活コーディネート | https://www.nitori-net.jp/ec/feature/coordinate/newlifecc/ | NITORI official seasonal coordinate | Needs / lifestyle-based Coordinate 監査 | READ | 6畳例、Layout、Storage、Gaming、Makeup、Movie 等の生活目的 | Seasonal Growth Loop の既存 Seed 候補。 |
| NIT-011 | 引っ越し・部屋づくり特集 | https://www.nitori-net.jp/ec/feature/kurashi/250101/ | NITORI official seasonal feature | Problem-based discovery 監査 | READ | 6 / 8畳 Layout、Before / After、悩み解決、店舗・EC導線 | Problem-based content が既に一部存在する証拠。 |
| NIT-012 | Product detail example | https://www.nitori-net.jp/ec/product/2112100007822/ | NITORI official product detail | Product ↔ Store / Coordinate / Commerce 監査 | READ | 商品情報、Cart、店舗受取、在庫、Floor map、関連商品、Staff Coordinate | 2026-08-18 に動的表示を確認。価格・在庫は変動する。 |
| NIT-013 | 店舗在庫・展示確認 FAQ | https://www.faq.nitori-net.jp/question/01j2rwgse30e751ca31wa8dr01 | NITORI official FAQ | 店舗情報の公式補足 | PARTIALLY_READ | 商品単位の在庫・展示確認、店舗受取の存在 | 詳細な社内 API 契約は公開情報から確認できない。 |
| NIT-014 | NITORI EC home | https://www.nitori-net.jp/ec/ | NITORI official EC | Product Master の上位出所 | READ | 商品ページ・検索・購入の公式 EC | Room Harmony 商品 CSV の出所説明にも使用。 |
| NIT-015 | System kitchen reform material | https://www.nitori.co.jp/reform/reformmenu/system_kitchen/ | NITORI official corporate | 既存課題資料 URL の保存 | NOT_YET_VERIFIED | System kitchen / reform の背景資料候補 | 現 Room Harmony の9カテゴリ商品入力元ではないと既存 README が明記。今回の Product Definition の根拠には未使用。 |
| NIT-016 | 新生活用品・お部屋別コーディネート | https://www.nitori-net.jp/ec/feature/newlifegoods/#room | NITORI official feature | Goal 4B/4Cの主要Coordinate・Home画像選定 | VERIFIED | 5つのワンルーム例と各4視点、収納・仕事・睡眠・くつろぎの視覚差 | Userが本Prototypeでの使用許可を確認。Coordinate 15枚とHome 4枚を別Source viewからローカルWebP化。一般的なOpen licenseではなく、Runtime hotlinkもしない。個別asset URLはmanifestに記録。 |
| NIT-017 | Goal 4C curated product detail set | https://www.nitori-net.jp/ec/product/8842174/ | NITORI official product detail set | 18商品のIdentity / price / main image alignment | VERIFIED | 6Category×3件の商品名、商品コード、日付付き価格、主画像、公式商品URL | 代表LinkはNカラボ3段。18件すべての公式商品URLと公式主画像URLは`data/seed/product_asset_manifest.json`に記録し、ローカルWebPだけをRuntime表示する。価格は2026-08-19観察値。 |

## Existing Room Harmony sources

監査基準 commit: `d41f411a783f555fd4828cb001695c30126e3bb5`（2026-08-18）。以下の GitHub URL は同 commit に固定する。

| Source ID | Source name | URL | Source type | Purpose | Retrieval status | What it supports | Notes |
|---|---|---|---|---|---|---|---|
| RH-001 | Existing Room Harmony repository | https://github.com/Raiden-Blade/room-harmoney | GitHub repository | Read-only implementation reference | VERIFIED | Repository 全体と現在の責務 | Local checkout の HEAD / clean status を確認。変更禁止。 |
| RH-002 | Room Harmony README | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/README.md | Repository document | 実装済みフロー・Data limit の監査 | READ | QR、Chat、推薦、Route、9,180商品、外部LLM未接続 | README の主張はコード・Data と突合した。 |
| RH-003 | System design | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/docs/DESIGN.md | Repository document | Architecture / API 監査 | READ | FastAPI / React、API、Data model、Store route | 現在の設計文書。 |
| RH-004 | Decision log | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/docs/DECISIONS.md | Repository document | 前提・制約監査 | READ | 中分類Lift、sample map、会員Data optional slot、QR | 発注者確認済み前提を記録。 |
| RH-005 | Chatbot requirements | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/docs/CHATBOT_REQUIREMENTS.md | Repository document | Chat 境界・成功指標監査 | READ | 最大3問、no external LLM、privacy、future adapter | 外部 NITORI Bot への実接続は対象外と明記。 |
| RH-006 | Chatbot audit | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/docs/CHATBOT_AUDIT.md | Repository QA document | 実ブラウザ監査・既知修正の確認 | READ | Integrated prototype の検証履歴と残課題 | 「本番効果証明済みではない」と明記。 |
| RH-007 | Data specification | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/data/README.md | Repository document | Data provenance / replacement boundary | READ | 9,180商品、仮Lift、暫定6Coordinate、sample map | Local JSON の件数も再集計した。 |
| RH-008 | Hybrid recommender | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/backend/recommender/hybrid.py | Source code | Candidate generation の監査 | READ | 中分類Lift + Coordinate affinity | Candidate の真実源。 |
| RH-009 | Guided reranker | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/backend/recommender/guided.py | Source code | Guided Chat 後段処理の監査 | READ | 候補集合内の explainable reranking | 新商品・未知組合せを生成しない。 |
| RH-010 | Chat service and provider boundary | https://github.com/Raiden-Blade/room-harmoney/tree/d41f411a783f555fd4828cb001695c30126e3bb5/backend/app/chat | Source code | Chat orchestration / future adapter 監査 | READ | QuestionPolicy、TemplateResponseComposer、ResponseComposer | 現在は外部 AI 通信なし。 |
| RH-011 | Route graph | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/backend/routing/graph.py | Source code | Multi-product route 監査 | READ | NetworkX shortest path + nearest-neighbor order | 厳密 TSP 最適化ではなく近似。 |
| RH-012 | OpenAPI snapshot | https://github.com/Raiden-Blade/room-harmoney/blob/d41f411a783f555fd4828cb001695c30126e3bb5/docs/openapi.json | API specification | Integration surface 監査 | READ | session / qr / products / recommendations / chat / route / events | New Community から直接接続は今回行わない。 |

## Development runtime sources

以下は起動案内の公式配布先であり、Product仮説やNITORI機能の根拠には使わない。

| Source ID | Source name | URL | Source type | Purpose | Retrieval status | What it supports | Notes |
|---|---|---|---|---|---|---|---|
| DEV-001 | Python Releases for Windows | https://www.python.org/downloads/windows/ | Python official | Windows runtime install destination | VERIFIED | Python official Windows installer availability | MVPのminimum versionはRepository contract / test environmentによる。 |
| DEV-002 | Node.js official download | https://nodejs.org/ | Node.js official | Node / npm install destination | VERIFIED | Node.js official distribution entry | Supported rangeはVite engineとlocal clean-room testに基づく。 |

## Retrieval caveats

- **OBSERVATION**: NITORI の件数・価格・在庫・表示順は 2026-08-18 時点の画面観察であり、固定仕様ではない。
- **OBSERVATION**: Public coordinate surfaces で見つからなかった機能は、非公開機能や別導線の不存在まで証明しない。
- **VERIFIED FACT**: Existing Room Harmony は上記 commit の local checkout を直接読んだ。今回の作業ではその repository に書込みを行わない。
- User uploadは外部Source registryの証拠ではなく、`USER_DECLARED_UNVERIFIED`なLocal prototype contentとして別管理する。URL、filename、EXIFをSource evidenceに昇格させない。
