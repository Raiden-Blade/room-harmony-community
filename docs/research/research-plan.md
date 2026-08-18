# Research and Validation Plan

## Priority A — before or during MVP

### A1. Furniture purchase journey

Questions:

- 家具購入時にCoordinateをいつ・何のために参考にするか。
- Single itemからroom-level considerationへ移るtriggerは何か。
- SNS / Staff / Official caseのtrust差は何か。

Method: 8〜12名のsemi-structured interview + recent-purchase timeline。明確な好みがある群と曖昧な群を分ける。

### A2. Room / budget / existing furniture pain

Method: Card sorting + prototype task。Room size、budget、housing、household、need、existing furnitureのうちTop 3を選ぶ。

Decision: Home inputとsimilarity weights。

### A3. Similar-to-me concept test

Method: Popular baseline vs deterministic similar results。Result relevance、time-to-useful、product click、reason comprehension。

Decision: H-01。

### A4. Structured detail / multi-product exploration

Method: Image + item list baseline vs room context + roles + total variant。

Decision: H-02 / CAMPER definition。

### A5. Private PLAN and Store handoff

Method: User task + 5〜8名のStore Staff role-play。Plan completion time、correction count、handoff usefulness。

Decision: H-03 / H-04、Room Harmony payload。

### A6. New-life multi-item purchase

Need from NITORI: approved aggregate or study. Do not invent a reference rate.

Decision: Segment focus and final business case。

## Priority B — after MVP value signal

### B1. Creator motivation

Compare recognition concepts: Like、参考になった、Save、Remix、Product exploration、Official Pick。投稿意向だけでなく過去のsharing behaviorを聞く。

### B2. Remix participation

Private adaptation usageから開始し、public lineageを見せるconcept testへ進む。Copy / plagiarism concernも調査。

### B3. Seasonal participation

Newlife / storage / summer / winterのneed relevance、reward、Staff / designer seedの効果を比較。

### B4. Creator / Staff seed

Quality criteria、production effort、update cadence、brand governanceを評価。

## Priority C — production economics and operations

- Campaign / reward cost
- Image / comment moderation cost
- Content licensing / deletion operations
- Product mapping / discontinued item maintenance
- Development / hosting / analytics cost
- Staff training and service time
- Privacy / security / legal review

## Study designs

| Study | Sample | Key measure | Main bias guard |
|---|---:|---|---|
| Exploratory interview | 8〜12 | journey / pain themes | split clear vs ambiguous preference |
| Formative usability | 5〜8 per iteration | completion / errors / misunderstanding | realistic tasks, not guided demo |
| Similar ranking test | baseline-derived | qualified view / product categories | exposure logging, same seed inventory |
| Detail variant test | baseline-derived | CAMPER / store action | avoid CTA position confound |
| Staff handoff test | 5〜8 staff | time / correction / usefulness | compare current workflow |
| Creator concept | 8〜12 creators | qualified contribution intent | behavior evidence, not intent only |
| Purchase validation | power analysis required | assisted co-purchase | randomization / POS join / leakage check |

## Interview segmentation

- Preference clarity: clear vs vague
- Life event: newlife / moving vs ongoing improvement
- Room constraint: small / rental vs unconstrained
- Purchase intent: single product vs room set
- Existing furniture: keep vs replace
- Channel: EC-first vs store-first

## Research ethics and privacy

- Room photos / floorplans are sensitive; collect minimal data and define deletion.
- Do not store participant names / contact in this public repository.
- Staff feedback is not a substitute for customer evidence.
- Intent statements are weaker than observed task behavior.
- Sales outcome claims require approved business data and causal design.

## Decision cadence

After each study, update:

1. Evidence Map
2. Assumptions status
3. Product / MVP decision
4. New risk
5. Continue / revise / stop recommendation
