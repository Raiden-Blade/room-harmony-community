# Participation Ladder

全Userが投稿する前提を置かない。低負担行動にも独立したUser valueを持たせる。

| Stage | User value | Business value hypothesis | Required feature | Primary KPI | MVP |
|---|---|---|---|---|---|
| Browse | 自分に近い事例を短時間で知る | Coordinate asset活用、multi-category awareness | Explore、filter、match reason | qualified coordinate view rate | Yes |
| React | 役立った意思を簡単に返す | Content quality signal、Creator recognition | `参考になった`等 | helpful reaction rate | No |
| Save | 後で比較できる | Purchase consideration signal | Saved list | save rate / revisit rate | Yes |
| Adapt / Remix | 自分の条件に変える | Intent depth、product substitution learning | parent link、change reason、diff | adaptation start / complete | Limited private |
| Plan | 予算・既存家具・商品を整理 | Multi-product consideration | My Coordinate PLAN | products per plan / category breadth | Yes |
| Store / EC | 実物・購入条件を確認 | Channel action | Official CTA / handoff | store / EC action rate | Yes |
| Purchase | 実現する | 同一空間商品の併売 | Future POS join | assisted multi-item purchase rate | Future |
| REAL ROOM share | 工夫を誰かに役立てる | Reusable authentic cases | upload、provenance、moderation | qualified real-room contribution | No |
| Referenced by others | 自分の工夫が役立ったと分かる | Creator retention / better seed | impact feedback | saves / adaptations from coordinate | No |

## Intent depth model

初期Analyticsでは次の順を **HYPOTHESIS** として持つ。固定の真理ではない。

```text
Impression
< View
< Save / Product View
< Adapt
< Add to My Coordinate
< Store View / EC Action
< Purchase Intent
< Verified Purchase
```

Like / Reactionは情緒価値がある一方、Purchase intentの強さとは別軸として扱う。

## Creator value

Creatorへの価値をLike数だけにしない。

- 何人が「参考になった」と答えたか
- 何人がSaveしたか
- 何人が自分向けにAdaptしたか
- どのRoom / Need条件の人に役立ったか
- Product exploration / Store actionへ何件つながったか（Privacy-safe aggregate）
- Official Pick / Seasonal collectionへの選出

**HYPOTHESIS**: 「自分のCoordinateが誰かの暮らしに役立った」というfeedbackは、単純なPopularity競争より良質なREAL ROOMの継続投稿に適する。

## Anti-gaming and safety notes

- Reaction / Save数はrankingの唯一のSignalにしない。
- Staff / Official / User、REAL / PLAN、verified / declaredを分離。
- Creator impactは個人を追跡できない集計で返す。
- Public post、comment、follow、leaderboardはModeration / abuse / youth-safety方針確定後。
