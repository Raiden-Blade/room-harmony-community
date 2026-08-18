# Goal 4 Final Self-review

Review date: 2026-08-19 JST

Branch: `agent/final-demo-hardening`

Goal 4 result target: `READY_FOR_FINAL_HUMAN_REVIEW`

`PASS`はLocal Functional Prototypeとしての実装・自動検証・目視確認を意味する。Production readiness、NITORI公式採用、Business upliftを意味しない。Physical second PCとProjectorはCodex環境では実施できないため、最後までManual Gateとして残す。

| # | Review item | Status | Evidence / boundary |
|---:|---|---|---|
| 1 | Product positioning | PASS | Coordinateを見る→PLAN→店舗・EC準備→REALとして循環するPlatform |
| 2 | NITORI版Instagram化していない | PASS | Feed / Follow / Comment / DM / generic Likeなし |
| 3 | Coordinate core | PASS | Planning / CommerceがMain navigationとHomeの主導線 |
| 4 | Similar-to-me | PASS | deterministic Room / Need / Budget ranking、理由表示 |
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
| 15 | USER_DECLARED distinction | PASS | `USER_DECLARED_UNVERIFIED`、About disclosure |
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
| 27 | Archive | PASS | 2027 archived REAL examplesをCurrent PLANへ再利用 |
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
| 39 | Responsive | PASS | 390 / 768 / 1280 E2E + 57 rendered captures、horizontal overflowなし |
| 40 | Accessibility basics | PASS | skip link、semantic controls、labels、alt、heading、focus、alert / status |
| 41 | Analytics semantics | PASS | controlled event / property allowlist、passive exposureをruntime内`trackOnce`、Actionは非dedupe |
| 42 | Session privacy | PASS | raw `owner_session_id`、filename、path、free textをPublic / Analyticsへ出さない |
| 43 | Main image repetition | PASS | Main Demo 15 Coordinateを個別local SVGへmapping |
| 44 | Independent image replacement | PASS | manifest / seed asset referenceはranking・Save・PLAN logicから分離 |
| 45 | Realistic synthetic readiness | PASS | future `.webp` filenameとvisual directionを15件定義 |
| 46 | Fallback behavior | PASS | `SafeImage` + local room / product fallback、missing asset test |
| 47 | Rights | PASS | repository-original SVG / user uploadのみ。NITORI / Instagram / third-party image copy・hotlinkなし |
| 48 | Visual asset documentation | PASS | `visual-asset-plan.md`とmachine-readable manifest |
| 49 | Visual QA isolation | PASS | process-scoped DB / upload、port 8100 / 5174、Main DB非汚染、residueなし |
| 50 | Demo reset | PASS | Save / Helpful / PLAN / Creator / Public REAL / upload / Entryを作成後、Seed 36 / 60 / 6 / 8へ復元 |
| 51 | Reset safety | PASS | exact `.demo` targets、confirmation、source / logs / captures保持、unmanaged process拒否 |
| 52 | Windows lifecycle | PASS | current checkoutでreset → `start-demo.cmd -NoBrowser` → health確認。owned stop / port release |
| 53 | Backend tests | PASS | 54 passed |
| 54 | Frontend tests | PASS | 24 passed |
| 55 | Browser E2E | PASS | 12 passed、9 functional + 3 responsive、temporary residue 0 |
| 56 | Production build | PASS | Vite build、64 modules、JS gzip約103kB |
| 57 | Dependency checks | PASS | npm audit 0 vulnerabilities、pip check clean |
| 58 | Seed validator | PASS | 36 Coordinate / 60 Product / 6 Challenge / 8 Entry + asset manifest |
| 59 | Fresh clone | PASS | `e3c7944`を新規clone。venv / node_modules / `.demo`なしからone-click start、health / frontend / Demo 1 API、stop / reset、tracked status cleanを確認 |
| 60 | GitHub CI | PENDING_PR | Goal 4 PR作成後にGitHub最新checkを確認 |
| 61 | Existing Room Harmony untouched | PASS | read-only checkout commit / clean statusをFinal Gateで再確認する |
| 62 | Source registry | PASS | 新外部Sourceなし。assetはlocal originalでsource-links追加不要 |
| 63 | Second physical Windows PC | MANUAL_SECOND_PC_TEST_REQUIRED | 実機Checklistあり。未実施をPASSとしない |
| 64 | Projector / display | MANUAL_REQUIRED | zoom 100%、Home / Explore / Challenge / Handoffを人が確認 |

## Known limitations accepted for final human review

- Production authentication、moderation console、deployment、schedulerはない。
- Product / price / image / Challengeはsynthetic Demo data。`DEMO-*`を実SKUとして扱わない。
- Current recommendationはfixed-weight deterministic ruleでAI / LLMではない。
- HandoffはPreview contractだけで、Room Harmony、NITORI API、inventory、POS、Cartへ送信しない。
- Built-in room imagesはoriginal flat SVG。15件は視覚差を付けたが、realistic synthetic imageryはHumanが後から提供する。
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
- [ ] realistic synthetic room imagesを採用する場合はrightsとmanifest mappingを再確認
