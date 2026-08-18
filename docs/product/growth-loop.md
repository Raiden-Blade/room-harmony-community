# Core Growth Loop

## Loop definition

```mermaid
flowchart LR
  A[Official / Staff / REAL seed] --> B[自分に近いCoordinateを発見]
  B --> C[Save / Product exploration]
  C --> D[Private PLAN / Adapt]
  D --> E[EC / Store / Adviser / Room Harmony]
  E --> F[REAL LIFE]
  F --> G[Structured REAL ROOM]
  G --> H[Creatorに役立ちfeedback]
  H --> A
```

## Why this is a growth loop

Outputが次のUserのinputになるためである。単発CampaignやContestは参加を集めても、REAL Room context・Product・Need・provenanceが再利用可能でなければLoopを作らない。

## Loop mechanics

| Loop step | User value | Asset created | Next-step trigger | Business hypothesis |
|---|---|---|---|---|
| Discover | 自分に近い実例 | View / match signal | Save / Product view | Relevant discovery increases exploration |
| Save / Adapt | 検討を失わない | Intent + private PLAN | Total / action CTA | Structured intent broadens category set |
| Store / EC | 実現可能性を確認 | Action event | Purchase / revisit | Channel handoff reduces drop-off |
| REAL | 実生活の工夫を記録 | Authentic coordinate | Moderated publish | Real cases improve trust |
| Recognition | 役立ったと分かる | Creator motivation | Next contribution | Feedback sustains quality supply |
| Relevance | 次のUserに近い事例 | Better retrieval data | New PLAN | More useful inventory improves demand |

## Cold start

1. Existing Official / Staff Coordinateを権限確認のうえSeed化。
2. Public User Coordinateは無断Importせず、まずLink / referenceまたは許諾済みsample。
3. Newlife等のNeed / Room contextを少量手動annotation。
4. Staff / designerがPLANとREALのpaired exampleを作る。
5. Similar-to-me retrievalをPopularityより先に検証。

## Failure modes

- Feedが美しい写真だけになり、Room / Need / Product dataが欠ける。
- Creator competitionが過度になり、現実的でない高予算Roomへ偏る。
- Save数の多い旧Contentだけが露出し、new / niche caseが消える。
- PLANが大量に作られるがStore / EC actionに進まない。
- Store / EC遷移でcontextを失い、Loop measurementが切れる。
- Public postingを先に作り、Moderation costがValueを上回る。

## Growth guardrails

- Qualified Coordinate rate（Room context + products + provenanceが揃う割合）
- Useful-for-me coverage（主要Need / Room segmentで最低件数を満たす割合）
- Popularity concentration（Top 1%へのimpression集中）
- Report / rejection rate（Public contribution開始後）
- Store / EC action quality（誤link、stock mismatch、dead product）

## Growth claim

**HYPOTHESIS**: Structured PLAN / REALとCreator impact feedbackを備えたLoopは、単発Contestより再利用可能なCoordinate supplyを持続させる。現時点では未検証。

## Goal 3 Seasonal reuse readiness

Goal 3はChallengeを新しい投稿SNSとして足さず、Goal 2のCoordinate / lineageを年間Loopへ接続する。

```text
前年Archive → 発見 / Save → Private PLAN → Adapt → Public derivative
→ Current Challenge Entry → Creator reuse signal → 翌年Archive
```

`seasonal_landing_view`、`challenge_view`、Entry start / complete / rejected、previous-year view、adapt start、recognition view、archive viewをcontrolled propertyで記録する。これは成長を証明する結果ではなく、次のUser testでreuse funnelを計測できる状態である。
