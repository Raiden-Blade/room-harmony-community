# Assumptions and Unknowns

## Evidence labels

- `VERIFIED FACT`: Official source / repository / actual dataで確認。
- `OBSERVATION`: Audited screen / codeから直接観察。
- `INFERENCE`: 複数のfact / observationからの合理的解釈。
- `HYPOTHESIS`: 今後のResearch / experimentで検証。

## Product assumptions

| ID | Assumption | Label | Risk if false | Validation |
|---|---|---|---|---|
| A-01 | NITORIには再利用可能な大量のCoordinate assetがある | VERIFIED FACT | Seed strategyが崩れる | Official list / content audit済み |
| A-02 | Asset間のpersistent PLAN stateが主要Gapである | INFERENCE | 新Productが重複になる | Stakeholder + user journey audit |
| A-03 | UserはPopularより自分に近い条件を重視する場面がある | HYPOTHESIS | Similar-to-meが使われない | Ranking experiment + interview |
| A-04 | Room / Need / Budgetの3入力以内で十分な価値が出る | HYPOTHESIS | 入力負担または精度不足 | Usability + result relevance test |
| A-05 | Structured Coordinateはmulti-category explorationを増やす | HYPOTHESIS | Detail追加がclickに影響しない | H2 experiment |
| A-06 | SaveからPrivate PLANへのstepは行動意図を深める | HYPOTHESIS | Saveで十分、PLANは冗長 | H3 experiment |
| A-07 | Store Staffは事前PLANを役立つと感じる | HYPOTHESIS | 接客入力・訂正負荷が増える | Staff role-play / task time |
| A-08 | Existing furniture表現は買い足し需要に重要 | HYPOTHESIS | 利用率が低くcomplexityのみ増える | Interview /PLAN usage |
| A-09 | Creatorは「誰かに役立った」feedbackで継続する | HYPOTHESIS | Supply loopが成立しない | Creator interview / concept test |
| A-10 | Seasonal REAL→PLAN loopが翌年再利用される | HYPOTHESIS | Contentが陳腐化 / product discontinued | Cohort / content reuse analysis |

## Data and integration assumptions

| ID | Assumption | Label | Current evidence / gap |
|---|---|---|---|
| D-01 | Product ID / official URLのapproved feedを将来得られる | HYPOTHESIS | Current Room Harmonyはmanual CSV; contract未確認 |
| D-02 | Coordinate images / textを新Platformで再利用できる | HYPOTHESIS | Public viewingとreuse permissionは別 |
| D-03 | Price / inventory / floor mapのofficial deep link / APIがある | PARTIAL OBSERVATION | Public UIはあるがcontract不明 |
| D-04 | Room Harmony product IDsとofficial IDsをmappingできる | HYPOTHESIS | Current source URLsはあるがformal mappingなし |
| D-05 | Community eventとfuture POSをprivacy-safeにjoinできる | HYPOTHESIS | Approval / identifier / retention未定 |
| D-06 | Instagram user coordinateのselection / permissionを確認できる | Unknown | Public pageだけではworkflow不明 |

## Operational assumptions

| ID | Assumption | Label | Validation owner |
|---|---|---|---|
| O-01 | Staff / Official seedを継続更新できる | HYPOTHESIS | Content owner / workload study |
| O-02 | Public REAL ROOMのmoderation costを許容できる | HYPOTHESIS | Legal / CX / moderation pilot |
| O-03 | Product discontinued時もhistorical coordinateを保持できる | HYPOTHESIS | EC / legal / content policy |
| O-04 | Staff coordinateとuser coordinateでtaxonomyを共有できる | HYPOTHESIS | Data workshop |
| O-05 | Official Pick / seasonal recognitionに公平なcriteriaを作れる | HYPOTHESIS | Governance design |

## Assumptions intentionally not made

- UGCは必ず売上を上げる。
- Contestは必ずUserを増やす。
- LikeがPurchase intentを示す。
- AI generationがCoordinate qualityを上げる。
- 公開PageをScrapeしてProduction利用できる。
- NITORI内部Dataは常に最新・完全である。
- Room HarmonyのPrototype metricsがReal store効果を証明する。
