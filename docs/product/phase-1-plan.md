# Phase 1 Recommended Implementation Plan

本書は人間Review後に開始する推奨計画である。今回のGoalでは実装しない。

## Phase 1 outcome

3つのMVP仮説をUser testできる、独立したlow-risk prototypeとinstrumentation specificationを作る。Production integrationは行わない。

## Entry decisions required

1. Seed contentを何で構成するか（Official / Staff再利用許諾、またはsynthetic demo）
2. Primary targetを「新生活6畳・一人暮らし」等に絞るか
3. PLANの保存をlocal-onlyにするか、test identityを持つか
4. Price snapshotを表示する権限と更新方法
5. Room Harmony handoffのowner / review process
6. Usability test参加者とStore Staff reviewer

## Workstreams and gates

### P1. Evidence and content contract

- Source / permission matrixを承認
- Qualified Coordinate definitionを確定
- Taxonomy v0（room / need / style / role / provenance）を20例で検証
- 40〜60 Seedを作成または変換

Gate: 全Seedがsource、permission、provenance、product reference、context validationを通る。

### P2. Experience prototype

- Home / Explore / Detail / Saved / My Coordinateのclickable prototype
- Similar-to-me 3-input以下
- PLANのlimited adapt（keep / replace / existing）
- Product / EC / Room Harmony CTA
- Mobile first、keyboard accessibility、empty / unavailable / expired price states

Gate: 5名程度のformative testで主要flowをmoderator interventionなしに完了でき、REAL / PLANを誤解しない。

### P3. Deterministic retrieval

- Weighted rule-based similarity
- Match reason
- Popular / editorial fallback
- Sparse-segment fallback
- No ML

Gate: Golden casesでexpected top resultsとreasonが再現可能。Popularity concentrationを確認。

### P4. Analytics and experiment contract

- Event dictionary、exposure semantics、anonymous identity、retention period
- H1 / H2 / H3のbaseline / variant
- CAMPER calculation test
- Consent / privacy review

Gate: Synthetic event setからKPIを再現し、double count / missing exposureがない。

### P5. Integration boundary prototype

- Official EC link pattern
- Room Harmony handoff payload validator
- Return URL / error / unavailable state
- No live Room Harmony or internal API call

Gate: Contract reviewでCommunity / Room Harmonyのowner、field、PII boundary、versioningが合意。

### P6. Staff and user validation

- Ambiguous-needs user / clear-preference userを分けたtest
- Store StaffにPLANを渡すrole-play
- Existing NITORI flowとのcomparative walkthrough
- FindingsをEvidence Mapへ反映

Gate: 継続 / revise / stop decisionをDocument化。

## Suggested delivery sequence

| Week | Focus | Deliverable |
|---|---|---|
| 1 | Source permission + target narrowing | Approved seed and taxonomy |
| 2 | Low-fidelity UX + content model | Testable flow |
| 3 | Seed dataset + deterministic retrieval | Golden-case demo |
| 4 | Functional prototype + events | Instrumented MVP |
| 5 | User / Staff tests | Findings and revisions |
| 6 | Decision review | Go / revise / stop package |

Scheduleはteam capacity未確認の仮案であり、commitmentではない。

## Definition of done

- H1〜H3の各hypothesisにtest結果が紐づく。
- Seed provenance / permissionが追跡可能。
- REAL / PLAN、Official / Staff / User declaredが視覚的に区別される。
- CommunityとRoom Harmonyはrepository / runtime / data ownership上で分離。
- Handoffはcontract testまでで、live integrationなし。
- No unapproved scraping / internal API / POS。
- Accessibility、mobile layout、empty / error stateをvisual QA。
- Continue / revise / stopのDecisionが可能。

## Post-Phase 1 candidates — not commitments

Public REAL ROOM contribution、Creator impact、Seasonal collection、1世代を超えるRemix、NITORI account、approved inventory / map / POS integration、LLM conciergeは、MVP evidenceとoperation approval後に別Decisionとする。
