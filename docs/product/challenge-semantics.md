# Challenge Semantics

## Product meaning

Challengeは投稿数や人気順位を競うContestではない。既存のPublic `Coordinate`を、季節・生活Event・制約という共通条件で見つけ、Private PLANへAdaptし、翌年にも再利用するための参加Layerである。

```text
Public REAL / PLAN
→ structured eligibilityをServerで確認
→ Challenge Entry
→ 次のUserが発見
→ Save / Private PLAN / Adapt
→ Public derivative
→ 次年度Archiveのinput
```

EntryはCoordinate本体をCopyしない。`ChallengeEntry`が`Challenge`と既存`Coordinate`を参照するため、Product構成、Creator、Parent / Root lineage、moderation、unpublishをGoal 2の一つのtruthとして再利用できる。

## Challenge states

| Status | Meaning | Entry |
|---|---|---|
| `UPCOMING` | 条件とThemeを予告する | 不可 |
| `ACTIVE` | 条件を満たすPublic Coordinateが参加できる | 可 |
| `ENDED` | 受付終了後、Archive前の閲覧状態 | 不可 |
| `ARCHIVED` | 前年事例として再発見・Save・Adaptできる | 不可 |

Functional PrototypeではstatusをDBに明示保存する。時刻から自動遷移するSchedulerはない。

## Eligibility

参加条件は説明文だけでなく、次のstructured fieldとして保持し、POST時にServerが同じRuleで検証する。

- room size band
- household
- housing type
- maximum budget
- Coordinate kind (`REAL` / `PLAN`)
- image requirement
- minimum Product count

Owner自身のPublicかつ`ACTIVE` moderationのCoordinateだけ参加できる。同一Challenge / Coordinate pairは一度だけで、他SessionのCoordinate、Private PLAN、Hidden / unpublished Coordinate、条件不一致、非ACTIVE Challengeは拒否する。

## Recognition

`Prototype Pick`はランキングではなく、Demo seedにだけ付けたcontrolled recognitionである。

- `SMALL_SPACE_IDEA`
- `SMART_BUDGET`
- `REAL_ROOM_STORY`
- `OFFICIAL_PICK`（画面では必ずPrototype Pickと表示）
- `USEFUL_REUSE`
- `EXISTING_FURNITURE`

UserはEntry APIからrecognitionを指定できない。実社員の公式選定、人気順位、品質保証を意味せず、画面でもこの境界を明示する。Like数・閲覧数・参加者数のfake seed countは保存しない。

## Archive and lineage

Archiveは過去結果の置き場ではなく、次年度のPLAN inputである。Archived Coordinateを`参考になった` / Saveし、Private PLANへAdaptするとGoal 2のParent / Root lineageが維持される。その派生Public Coordinateは条件を満たせば現在のACTIVE ChallengeへEntryできる。

## Moderation and ownership

- Coordinateをunpublishすると、そのCoordinateに紐づくActive Entryも`WITHDRAWN`になる。
- Hidden / withdrawn EntryはPublic galleryとreal DB countから除外する。
- Entry削除でCoordinateやlineageは削除しない。
- Anonymous SessionはPrototype ownershipであり、Production authenticationではない。

## Explicit non-goals

- Leaderboard、vote battle、prize、follower competition
- Challenge専用の二重投稿Model
- UserによるRecognition自己設定
- 実NITORI社員による公式審査
- 自動Season transition / notification
- 実商品、在庫、購入、POS、Room HarmonyとのLive接続
