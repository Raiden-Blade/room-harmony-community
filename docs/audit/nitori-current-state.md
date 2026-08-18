# Existing NITORI Coordinate Service Audit

監査日: 2026-08-18（JST）

## Executive conclusion

**VERIFIED FACT**: NITORI は既に、Staff Coordinate、Instagram 由来の User Coordinate、SKU・価格・Cart への接続、Room / Tag / 生活条件を伴う事例、商品起点の Staff Coordinate、簡易 Simulation、専門スタッフによる 3D / 見積相談、店舗在庫・Floor map を保有している。[NIT-001](../sources/source-links.md)〜[NIT-012](../sources/source-links.md)

**INFERENCE**: 新しい価値は「Coordinate 写真を新たに並べること」ではない。現状の複数資産を、`自分に近い事例の発見 → 自分向けPLAN → Store / EC行動 → REAL ROOM → 次の人の事例` へつなぐ構造にある。

**OBSERVATION**: 監査した公開画面では、Coordinate 単位の Native Save / Reaction / Comment / Follow、派生元を残す Remix、永続的な My Coordinate、PLAN→REAL の状態遷移は確認できなかった。これは非公開機能や未監査導線の不存在を意味しない。

## Current-state journey map

判定は今回監査した公開画面に限定する。`Not found` は「監査面で UI / 導線を見つけられなかった」、`Unknown` は確認材料が不足、`Partial` は目的の一部だけ満たす状態である。

| Journey | State | Direct evidence | Product implication |
|---|---|---|---|
| Discover | Existing | Coordinate Hub、Pick-up、Room別、Seasonal特集 [NIT-001][NIT-009][NIT-011] | 新Platformは単なる特集一覧を再実装しない。 |
| Browse | Existing | Staff / User の大量一覧、カテゴリタブ [NIT-002][NIT-003] | 既存資産を取り込む・参照する前提。 |
| Search | Partial | EC商品検索は存在。Coordinate一覧はカテゴリ中心で、今回の監査では全文・条件横断検索を確認できず [NIT-001][NIT-014] | Room / Budget / Need を横断する探索が候補。 |
| Filter | Partial | 商品カテゴリ、Staff / User、人気順等は存在 [NIT-002][NIT-003] | 6畳×賃貸×収納不足等の複合条件は別途検証。 |
| View Coordinate | Existing | 画像、説明、Creator、住居条件、Tag、使用アイテム [NIT-004][NIT-005] | Detailを再発明せず不足文脈だけ補う。 |
| View Product | Existing | 使用アイテムから商品へ、商品からStaff Coordinateへ [NIT-004][NIT-012] | 双方向接続は既に一部成立。 |
| Purchase | Existing | Cart、複数商品まとめ、店舗受取、EC注文 [NIT-004][NIT-006][NIT-012] | CommerceをCommunity内で再実装しない。 |
| Save Coordinate | Not found | 商品のお気に入りは確認。Coordinate単位の保存は監査面で確認できず [NIT-012] | 保存の需要と既存会員機能との重複をResearchする。 |
| React | Not found | 商品Reviewの「参考になった」はあるが、Coordinateへの反応は確認できず [NIT-012] | Likeより「参考になった / 真似したい」を候補にする。 |
| Comment | Not found | 監査したCoordinate DetailにNative commentは見つからず [NIT-004][NIT-005] | MVPから除外。運用負荷も調査対象。 |
| Follow | Not found | Staff / Instagram accountへの遷移はあるが、Native followは確認できず [NIT-004][NIT-005] | MVPから除外。 |
| Create / Post | Partial | User contentはInstagramの `#ニトリ` / `#mynitori` 投稿を掲載 [NIT-002][NIT-005] | Native uploadと誤認しない。選定・許諾・Moderation手順はUnknown。 |
| Remix | Not found | 派生元・変更点・genealogyは監査面で確認できず | 「Copy」ではなく条件変更を記録する設計が必要。 |
| Plan | Partial | 簡易Simulation、専門Staffの3D・見積・既存家財相談あり [NIT-006][NIT-007] | My PLANは既存相談の置換でなく、事前自己整理と引継ぎに限定。 |
| Compare | Partial | Appの商品比較は確認。複数Coordinate PLAN比較は未確認 [NIT-008] | Coordinate比較は仮説として検証。 |
| Visit Store | Partial | 商品在庫、Floor map、Store Mode、店舗受取あり [NIT-008][NIT-012][NIT-013] | Coordinate→商品→店舗は可能。PLAN一式の店内引継ぎは未確認。 |
| Re-share | Partial | 商品Share、User CoordinateからInstagram原投稿への導線あり [NIT-005][NIT-012] | Native PLAN→REAL共有は未確認。 |

## Asset inventory

### Coordinate content

- **OBSERVATION**: Staff Coordinate 一覧は 2026-08-18 時点で `全12392件` と表示され、人気順、商品カテゴリ、Room / Lifestyle / Style系Tag、Staff名・所属店舗を持つ。[NIT-003]
- **OBSERVATION**: User Coordinate 一覧は同日時点で `全13157件` と表示され、Instagramの `#ニトリ` / `#mynitori` 投稿を紹介している。[NIT-002]
- **OBSERVATION**: Staff Detail例は3画像、説明、1LDK、一人暮らし、Style / Storage等のTag、公開日、12件の使用アイテムと価格・Cart / 廃番状態を表示した。[NIT-004]
- **OBSERVATION**: User Detail例はInstagram原投稿・Account・Caption・使用アイテムを結び付ける。[NIT-005]
- **CAUTION**: 上記件数は変動する観察値であり、Database件数の契約値ではない。

### Room, style, tag, living conditions

**VERIFIED FACT**: 公開事例には Living / Dining / Bedroom / One-room、住居タイプ（例: 1LDK）、世帯（例: 一人暮らし）、Natural / Simple / Japanese modern等のStyle、収納・空間活用等のNeedが存在する。[NIT-001][NIT-003][NIT-004]

**INFERENCE**: 新Platformの課題は属性をゼロから作ることではなく、属性定義を正規化し、複合条件で比較可能にすることである。既存Tagを無断で新Schemaへ写す前に、公式Taxonomyと運用Ownerを確認する必要がある。

### Popularity and recommendation

- **OBSERVATION**: Staff listには人気順があり、一覧・Detail周辺には「よく一緒に見られているCoordinate」「あなたにおすすめのCoordinate」が表示される。[NIT-003][NIT-004]
- **UNKNOWN**: 公開画面だけではPersonalization signal、ranking formula、experiment designを確認できない。
- **INFERENCE**: 新Platformは「おすすめがない」と主張せず、`Useful for me`の説明可能なRoom / Need一致を別の検証対象とする。

### Product and commerce connection

- **VERIFIED FACT**: Coordinate Detailの使用アイテムは商品名・価格・Review数・商品Page・Cartに接続される。[NIT-004]
- **VERIFIED FACT**: Product Detailから、その商品を使ったStaff Coordinateへ遷移できる。[NIT-012]
- **VERIFIED FACT**: Product DetailはCart、店舗受取、在庫、他店舗在庫、Floor map、関連商品、まとめ買い金額を持つ。[NIT-012]
- **INFERENCE**: `Coordinate → Product` と `Product → Coordinate` は既に部分成立している。新Platformの差別化は、Room Context・Need・Budget・PLAN状態・既存家具まで含めた「購入計画」へ拡張することにある。

### Planning and adviser assets

- **VERIFIED FACT**: 「お部屋 de コーディネート」はLiving / Bedroom / Diningで、床・壁・天井・家具色を選び、Curtain / Rug / Cover類を組み合わせ、Sizeを選んで注文できる。[NIT-006]
- **VERIFIED FACT**: 「ニトリのインテリア相談」は専門StaffとのOnline通話、3D Size / Layout、Coordinate提案、Image / 見積、条件付きで手持ち家財も含む相談、店舗またはEC注文を提供する。[NIT-007]
- **INFERENCE**: CommunityのPLANは「高度な3D相談の代替」ではなく、利用者が相談前に希望を整理し、Staffに構造化されたPlanを渡す前段として位置付けるべきである。

### Store and app assets

**VERIFIED FACT**: NITORI AppはFavorite Store / Delivery、店舗在庫、Floor map、Store Mode、画像検索、Size memo、User / Staff Coordinate、商品比較、Order history等を案内している。[NIT-008]

**INFERENCE**: 新Communityが独自在庫・地図・Cartを持つのは重複と陳腐化Riskが大きい。承認済みDeep Link / APIが提供された場合に既存App / ECへ渡すのが妥当である。

### Seasonal and problem-based content

- **VERIFIED FACT**: 新生活特集は一人暮らしの準備、カテゴリ別Checklist、収納・狭い部屋等の課題を扱う。[NIT-009]
- **VERIFIED FACT**: 新生活Coordinateは6畳例と、Gaming / Makeup / Movie / Video editing / 多い服等のLifestyle needを扱う。[NIT-010]
- **VERIFIED FACT**: 引っ越し・部屋づくり特集は6 / 8畳Layout、Before / After、悩み解決、店舗・EC導線を持つ。[NIT-011]
- **INFERENCE**: Seasonal content自体は新しくない。未成立の可能性があるのは、前年のREALが翌年のPLANのSeedになり、その購入後のREALがまた蓄積される継続Loopである。

## Posting and creator audit

| Question | Finding | Label |
|---|---|---|
| Userはどこから投稿するか | Instagramで `#ニトリ` / `#mynitori` を付けた投稿がNITORI一覧に紹介される | OBSERVATION |
| NITORI内Native uploadがあるか | 今回監査したCoordinate画面では確認できない | OBSERVATION / Not found in audited surfaces |
| 掲載の選定・許諾・Moderation条件 | 公開画面から確定できない | Unknown |
| Staff identity | Staff名、所属店舗、住居条件等がDetail / Profile導線に表示される | OBSERVATION |
| User identity | Instagram account / original postへ接続される | OBSERVATION |
| Creator feedback | CoordinateへのSave / Remix / Product view等をCreatorへ返す機能は確認できない | OBSERVATION / Not found in audited surfaces |

## What must not be claimed

- 「NITORIにはCoordinateが少ない」— 監査結果と反する。
- 「NITORIにはVirtual planningがない」— Simulationと専門相談が既にある。
- 「商品とCoordinateがつながっていない」— 双方向に一部接続済み。
- 「店舗位置が分からない」— 商品Page / AppにFloor map導線がある。ただし公開API契約は未確認。
- 「Communityを作れば併売率が上がる」— **HYPOTHESIS**であり、行動LogとPOS突合が必要。

## Open questions

1. Official Coordinate / User Coordinate の再利用権限、画像利用範囲、更新Feedはあるか。
2. Existing Coordinate Tag / Room taxonomy を取得できる承認済みData sourceはあるか。
3. Coordinate単位のSaveや会員連携が別画面・App内に既に存在するか。
4. Product / Inventory / Store map / EC Deep Linkの正式契約は何か。
5. Instagram掲載の選定・許諾・削除・Moderation processは何か。
6. Online adviserへMy PLANを渡す運用上の価値と負荷はどうか。
