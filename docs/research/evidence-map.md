# Evidence Map

最終更新: 2026-08-18

## Current evidence

| Claim ID | Claim | Label | Evidence | Confidence | Decision supported |
|---|---|---|---|---|---|
| C-01 | NITORIにはStaff / User / Seasonal Coordinateが大量に存在する | VERIFIED FACT | NIT-001〜003、009〜011 | High | Content scarcityをProblemにしない |
| C-02 | Staff CoordinateはRoom / household / tags / explanation / products / pricesを持つ | OBSERVATION | NIT-004 | High for example, medium for all content | Structured seed is feasible but taxonomy audit required |
| C-03 | User CoordinateはInstagram hashtag投稿をNITORI画面で紹介する | VERIFIED FACT / OBSERVATION | NIT-002、NIT-005 | High | Native UGCを既存と誤認しない |
| C-04 | ProductからStaff Coordinate、CoordinateからProductへ接続できる | VERIFIED FACT | NIT-004、NIT-012 | High | Product↔Coordinateは拡張であり新規発明ではない |
| C-05 | NITORIには簡易Simulationと専門Staffの3D /見積相談がある | VERIFIED FACT | NIT-006、NIT-007 | High | Full 3D / adviser replacementを除外 |
| C-06 | NITORI App / Product pageはstore inventory / floor map等を持つ | VERIFIED FACT | NIT-008、NIT-012、NIT-013 | High for UI existence, low for API availability | CommunityはStore truthを再実装しない |
| C-07 | Public Coordinate surfaceでnative save / reaction / comment / follow / remix / persistent planは確認できなかった | OBSERVATION | NIT-002〜005 | Medium | Gap candidate; absence claimは限定する |
| C-08 | Room HarmonyはQR→product→recommend/chat→route→eventsを実装 | VERIFIED FACT | RH-002〜006、RH-012 | High | Integration responsibilitiesを分離 |
| C-09 | GuidedRerankerはcandidate setを維持し後段で並べ替える | VERIFIED FACT | RH-008、RH-009、RH-010 | High | Communityが推薦器を再実装しない |
| C-10 | Room Harmony商品Masterは9,180件、全件source URL、色は1,438件 | VERIFIED FACT | RH-007 + local JSON recount | High at audited commit | Current data contract / sparsity |
| C-11 | Room Harmony Lift / Coordinate / Map / POSは検証用 | VERIFIED FACT | RH-002、RH-007 | High | Production effectを主張しない |
| C-12 | External NITORI Bot / internal API / POSには実接続していない | VERIFIED FACT | RH-002、RH-005、RH-006 | High | Handoff contract only |
| C-13 | Existing assets are strong but user state is fragmented | INFERENCE | C-01〜C-12 | Medium | Product vision |

## Hypothesis map

| Hypothesis ID | Hypothesis | Causal link | Minimum evidence needed | Method | Decision |
|---|---|---|---|---|---|
| H-01 | Similar-to-me ranking outperforms popular-only for product exploration | relevance→view→product | exposed sessions + product categories | A/B or within-subject prototype test | Keep / revise ranking |
| H-02 | Structured roles + total broaden multi-category exploration | understanding→category breadth | detail variant event data | A/B | Keep / simplify detail |
| H-03 | Save→Private PLAN increases Store / EC action | intent→action | saved cohort / plan cohort | Randomized CTA or staged funnel | Keep / remove PLAN |
| H-04 | Existing furniture option improves plan completion | realism→completion | feature usage + qualitative reason | task test | Keep in core / defer |
| H-05 | Product→Coordinate improves cross-category discovery | product inspiration→coordinate→other product | product entry sessions | experiment | Promote entry / keep secondary |
| H-06 | Creator impact feedback increases qualified REAL contributions | recognition→supply | creator retention + quality | interview then pilot | Build feedback loop / defer |
| H-07 | Structured adaptation produces useful long-tail plans | remix→coverage | child plans by segment + action | private-plan analysis | Build public remix / keep private |
| H-08 | Seasonal REAL→PLAN loop creates recurring useful content | prior REAL→new PLAN→new REAL | year-over-year content reuse | longitudinal | Scale seasonal program / stop |
| H-09 | Community-assisted exploration predicts multi-item purchase | exploration→purchase | POS / order join | controlled experiment | Validate North Star |

## Evidence gaps blocking production

1. User demand: Coordinate reference rate、purchase journey、room / budget pain。
2. Causal outcomes: Save / PLAN / store action / purchase attribution。
3. Content rights: Official / Staff / Instagram-derived content reuse。
4. Data contracts: Product / price / stock / store / Room Harmony / POS。
5. Operations: moderation、discontinued product、staff workflow、support。
6. Trust: PLAN / REAL / verification wording comprehension。

## Evidence update rule

- 新しい主張にはClaim ID、label、source / method、date、decision impactを付ける。
- Sourceが読めない場合はURLをRegistryに残し、Factへ昇格させない。
- Interview quoteはparticipant contextとconsentを管理し、個人特定情報を本Repositoryへ置かない。
- KPI upliftはsample size、assignment、baseline、confidence intervalなしに「効果」と書かない。
