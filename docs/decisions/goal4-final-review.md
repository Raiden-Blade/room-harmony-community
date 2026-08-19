# Goal 4 Final Self-review

Review date: 2026-08-20 JST

Branch: `agent/final-demo-hardening`

Goal 4 result target: `READY_FOR_FINAL_HUMAN_REVIEW`

`PASS`はLocal Functional Prototypeとしての実装・自動検証・目視確認を意味する。Production readiness、NITORI公式採用、Business upliftを意味しない。Physical second PCとProjectorはCodex環境では実施できないため、最後までManual Gateとして残す。

| # | Review item | Status | Evidence / boundary |
|---:|---|---|---|
| 1 | Product positioning | PASS | Coordinateを見る→PLAN→店舗・EC準備→REALとして循環するPlatform |
| 2 | NITORI版Instagram化していない | PASS | Feed / Follow / Comment / DM / generic Likeなし |
| 3 | Coordinate core | PASS | Planning / CommerceがMain navigationとHomeの主導線 |
| 4 | Similar-to-me | PASS | ExploreでUserが選んだRoom / Need / Budgetだけを実一致理由として表示。Direct detailは中立な「このコーデの特徴」 |
| 5 | Product reverse discovery | PASS | Product → Coordinate → Private PLAN E2E |
| 6 | Save | PASS | current Sessionのunique save、empty CTAあり |
| 7 | Private PLAN | PASS | owner Sessionだけread / mutate可能 |
| 8 | Keep / Replace / Add | PASS | role制約とtotal再計算をE2E確認 |
| 9 | Existing Furniture | PASS | Product ID不要、購入候補額へ不算入 |
| 10 | Estimated Total | PASS | known total / unknown count / snapshot caveat |
| 11 | Store / EC actions | PASS | intent eventとofficial search link、purchaseなし |
| 12 | Handoff Preview | PASS | human-readable Summary + collapsed technical payload |
| 13 | `live_integration=false` | PASS | UI disclosureとE2E payload assertion |
| 14 | REAL / PLAN distinction | PASS | badge、Create説明、image requirement |
| 15 | USER_DECLARED distinction | PASS | Built-in Seedから`USER_DECLARED`を除外し、旧Local DBも既知Built-inだけ安全修復。User投稿は`USER_DECLARED_UNVERIFIED`を維持 |
| 16 | Safe upload | PASS | actual decode、JPEG / PNG / WebP、8MB / 25MP、random WebP、EXIF removal |
| 17 | Helpful vs Save | PASS | separate wording、table、API、event semantics |
| 18 | Helpful self-reaction | PASS | own Coordinateは403、別Session E2E |
| 19 | Adapt | PASS | Public REAL / PLAN → Private PLAN |
| 20 | Genealogy | PASS | Parent / Root / direct public children、private tombstone boundary |
| 21 | Creator Impact | PASS | current DB Helpful / Save / PLAN / Public derivative aggregate |
| 22 | Ownership | PASS | Private PLAN / Creator / edit / unpublish / image / Entry integration tests |
| 23 | Report | PASS | controlled reason、unique Session、auto-deleteなし |
| 24 | Seasonal Landing | PASS | Active / Upcoming / Ended / Archiveを分離 |
| 25 | Eligibility | PASS | server-side structured rule、actionable Japanese reason |
| 26 | Challenge Entry | PASS | owner Public Active Coordinate、duplicate prevention |
| 27 | Archive | PASS | 2027 archived reference PLAN examplesをCurrent PLANへ再利用。SeedをUser REALと誤表示しない |
| 28 | Previous-year reuse | PASS | Archive → PLAN → derivative → 2028 Entry E2E |
| 29 | Prototype Pick disclosure | PASS | non-official / non-staff / non-popularityをUI明示 |
| 30 | Recognition self-assignment | PASS | request schema `extra=forbid`、controlled seed only |
| 31 | No popularity leaderboard | PASS | real entry count / kind breakdownだけ。順位なし |
| 32 | No fake counts | PASS | current SQLite aggregate、Seedはentry rowsを持つ |
| 33 | No fake uplift | PASS | measurement readiness ≠ proven upliftをAbout / KPI / READMEへ明記 |
| 34 | Seasonal reuse definition | PASS | `direct_seasonal_reuse_count`へrenameし、direct child / all Session / no descendantを明文化・test |
| 35 | Challenge date / status | PASS | 2028想定Demo、statusはmanual seed-controlledと表示 |
| 36 | Error states | PASS | backend unavailable、missing entity、upload、eligibility、duplicateを日本語化。stack traceなし |
| 37 | Empty states | PASS | Saved / PLAN / Creator / Challenge candidate / Explore / Productにnext CTA |
| 38 | Loading states | PASS | common Loading statusを主要async routeで使用 |
| 39 | Responsive | PASS | 390 / 768 / 1280 E2E + 57 rendered captures、horizontal overflowなし。全ページを段階Scrollし、長いMobile Exploreでも全15写真の描画を目視確認 |
| 40 | Accessibility basics | PASS | skip link、semantic controls、labels、alt、heading、focus、alert / status |
| 41 | Analytics semantics | PASS | controlled event / property allowlist、passive exposureをruntime内`trackOnce`、Actionは非dedupe |
| 42 | Session privacy | PASS | raw `owner_session_id`、filename、path、free textをPublic / Analyticsへ出さない |
| 43 | Main image repetition | PASS | 写真中心Explore 15 Coordinate、Home Hero 4枚、Product / Create 18商品を、それぞれ集合内重複なしのNITORI公式参照画像へlocal mapping |
| 44 | Independent image replacement | PASS | Coordinate / Hero / Productの各manifestとseed asset referenceをranking・Save・PLAN logicから分離 |
| 45 | Optimized local imagery | PASS | Coordinate 15件は640×400、Product 18件は640×640、Hero 4枚は1200×750のWebPとしてlocal収録。Runtime hotlinkなし |
| 46 | Fallback behavior | PASS | `SafeImage`共通fallbackと既存個別SVGを維持。公式Identityを確認できない42商品は無理に実写化せず、写真中心Explore / Product pickerから除外 |
| 47 | Rights | PASS | User確認済みの本Prototype限定許可を`EXPLICITLY_PERMITTED`として記録。一般Open licenseとは主張しない |
| 48 | Visual asset documentation | PASS | `visual-asset-plan.md`、Source registry、About、README、Coordinate / Hero / Productのmachine-readable manifestを同期 |
| 49 | Visual QA isolation | PASS | process-scoped DB / upload、port 8100 / 5174、Main DB非汚染、residueなし |
| 50 | Demo reset | PASS | Save / Helpful / PLAN / Creator / Public REAL / upload / Entryを作成後、Seed 36 / 60 / 6 / 8へ復元 |
| 51 | Reset safety | PASS | exact `.demo` targets、confirmation、source / logs / captures保持、unmanaged process拒否 |
| 52 | Windows lifecycle | PASS | 空白を含むfresh-clone pathとalternate portでdependency install → `start-demo.cmd -NoBrowser` → Home / API / WebP 200 → repeated start → owned stop / port release → reset |
| 53 | Backend tests | PASS | 63 passed |
| 54 | Frontend tests | PASS | 33 passed（provenance、Product style compatibility、PLAN price notice / alt、既存Goal 4D回帰を含む） |
| 55 | Browser E2E | PASS | 12 passed、9 functional + 3 responsive、temporary residue 0 |
| 56 | Production build | PASS | Vite build、65 modules、JS gzip 105.54kB |
| 57 | Dependency checks | PASS | npm audit 0 vulnerabilities、pip check clean |
| 58 | Seed validator | PASS | 36 Coordinate / 60 Product / 6 Challenge / 8 Entry + 15 Coordinate / 4 Hero / 18 Product asset mapping |
| 59 | Fresh clone | PASS | `28c3399`を空白を含む新規cloneへ取得。venv / node_modules / `.demo`なしからinstall、15 unique photos、one-click lifecycle、reset、tracked status cleanを確認 |
| 60 | GitHub CI | PASS | PR #4の最新headでbackend / frontendがPASSであることをmerge gateとし、PR statusをSource of Truthとする |
| 61 | Existing Room Harmony untouched | PASS | read-only checkout commit / clean statusをFinal Gateで再確認する |
| 62 | Source registry | PASS | NIT-016（Coordinate）とNIT-017（Product）を追加し、個別asset URLは各manifestへ記録 |
| 63 | Home realism | PASS | 4枚の別々の公式室内画像を使う落ち着いたCarousel。原Conceptに沿うcopy / CTA / destination、SVG矢印、image-relative dots、8秒Auto-play、pause、reduced-motion |
| 64 | Product identity alignment | PASS | 6Category×3件の18商品で、名称・商品参照ID・価格・公式URL・主画像・Card / Detail表示を同一Identityへ固定 |
| 65 | Asset non-repetition | PASS | SHA-256で15 Coordinate / 4 Hero / 18 Productの各集合内に同一内容がないことをValidatorで強制 |
| 66 | Official reference reachability | PASS | 18公式商品pageがHTTP 200かつ商品参照codeを含み、18 source imageがHTTP 200 `image/jpeg`であることを2026-08-19にlive確認 |
| 67 | Second physical Windows PC | MANUAL_SECOND_PC_TEST_REQUIRED | 実機Checklistあり。未実施をPASSとしない |
| 68 | Projector / display | MANUAL_REQUIRED | zoom 100%、Home / Explore / Product / Handoffを人が確認 |

## Known limitations accepted for final human review

- Production authentication、moderation console、deployment、schedulerはない。
- Coordinate構成、投稿者、Challengeはsynthetic Demo data。60商品のうち18件だけがNITORI公式商品ページと同一Identityの日付付き参照スナップショットで、残る`DEMO-*` 42件を実SKUとして扱わない。
- Current recommendationはfixed-weight deterministic ruleでAI / LLMではない。
- HandoffはPreview contractだけで、Room Harmony、NITORI API、inventory、POS、Cartへ送信しない。
- 15件以外のBuilt-in Coordinate画像と42件のDemo Product画像はRepository-original SVGのままだが、写真中心のExplore / Coordinate商品欄 / Create pickerには表示しない。Direct fallbackの機能検証用としてのみ残す。
- 公式の部屋画像は検証用Coordinate構成の参考表示であり、画像内の家具一式を構成商品として特定したものではない。これに対し、18件の商品写真は名称・参照ID・価格・公式URLと商品単位で対応付けている。
- 公式商品価格は2026-08-19時点の参照Snapshotで、現在価格・在庫・販売継続を保証しない。
- Coordinate Styleは6種だが、公式Productの確認済みStyle compatibilityは`NATURAL` / `CLEAR_COOL` / `DANDY`だけである。`ELEGANT` / `COZY` / `COLORFUL`の公式Product候補は`UNVERIFIED_NEUTRAL`であり、確認済みStyle matchとして扱わない。
- `trackOnce`はReact StrictMode等の同一runtime重複を抑える。Browser refreshは新しいpage exposureとして扱う。
- Business upliftは未検証。正式User test、assignment、denominator、POS / order attributionが必要。

## Final manual release gate

- [ ] Goal 4 PRのUI walkthrough
- [ ] [`../operations/demo-script.md`](../operations/demo-script.md)を5〜8分で通す
- [x] Fresh clone evidenceを本表へ反映
- [x] Reset後、upload residueとprivate dataが無い
- [ ] Second physical Windows PC
- [ ] Projector / display、Browser zoom 100%
- [x] 390 / 768 / 1280
- [x] Handoff Preview / non-live disclosure
- [x] Prototype Pick / non-official disclosure
- [x] 15 Coordinate + 4 Hero + 18 Productの許可済み参照画像についてSource / rights / manifest / local fallbackを再確認
- [ ] Merge前にHumanが4枚のHero、主要15件のCoordinate、18件の商品Identityと画像の意味的整合を最終確認
