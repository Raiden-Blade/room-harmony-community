# Goal 2 Creator & Community Loop

## Product boundary

Goal 2はGeneric SNSではない。Coordinateを再利用可能な暮らしの単位として増やし、次のLoopをFunctional Prototypeにする。

```text
Creator → Public REAL / PLAN → discovery → Helpful / Save
→ Private PLANへAdapt → 商品・手持ち家具を調整
→ Public PLAN / REALとして再共有 → Creator Impact
```

Like、Follower、Comment、DM、Following Feed、Contest、viral rankingは扱わない。このGoal 2設計自体にはSeasonal Challengeを含めず、後続Goal 3がCoordinate上の独立したreuse layerとして追加した。Goal 4は新機能ではなく最終Demo hardeningだけを行う。

## Identity and ownership

- `CreatorProfile`は`display_name`とoptional `bio`を持つDisplay Identity。
- `owner_session_id`はanonymous Browser Sessionとの内部ownership checkだけに使用する。
- Public responseへraw Session ID、email、password、phone、real name、NITORI member IDを返さない。
- Public Coordinateのedit / unpublishは同じSessionだけ。Unpublishはsoft state changeでlineageを維持する。

## REAL / PLAN truth boundary

| Kind | Meaning | Public requirement | Truth label |
|---|---|---|---|
| REAL | Userが実際に存在すると申告した自分の空間 | 1〜5枚のroom image、Creator identity、itemまたはexisting furniture | `USER_DECLARED_UNVERIFIED` |
| PLAN | これから実現したい空間 | Creator identity、itemまたはexisting furniture | 購入・在庫確保・専門家承認ではない |

REALはSystem verifiedを意味しない。画像があることも、NITORI商品の購入や使用を証明しない。

## Image handling

UploadとPublishを分離する。Upload成功時にSession ownership付きのimage tokenを返し、Publish時に同じSessionの未使用tokenだけをAttachする。

1. multipartで最大8MBを読む。
2. JPEG / PNG / WebPのdeclared media typeをallowlistする。
3. Pillowでactual decode / verifyし、format mismatch、破損、25MP超過を拒否する。
4. EXIF orientation適用後RGBへ変換し、metadataを引き継がずWebPへ再encodeする。
5. random server filenameを`.demo/uploads/`へ保存する。original path / filenameはDBへ保存しない。
6. Public derivativeが元CreatorのUser uploadを暗黙転載しない。自分の画像がないPublic PLANはlocal placeholderを使う。
7. Unpublish時はDBのlineage tombstoneを残し、所有するlocal image fileを削除する。

Remote URL download、SVG / HTML / executable、repository commit、analyticsへのfilename / path / EXIF / binary送信は禁止する。

## Helpful and Save

- Helpful = 「このCoordinateが自分の暮らしの参考になった」。Session + Coordinateでunique、current reaction count、self-reaction禁止。
- Save = 「後で自分の検討に使う」。既存`CoordinateSave`を維持し、Private PLAN候補として扱う。

同じbutton、table、eventに統合しない。

## Adaptation and lineage

- Public Coordinateから作るPrivate PLANは`parent_coordinate_id = source.id`、`root_coordinate_id = source.root || source.id`。
- Private PLANを公開すると、Public childのparentはPrivate PLAN、rootは元Rootを保つ。
- Public responseは閲覧Sessionが所有しないPrivate parent IDを返さず、`非公開の参考元`として表示する。
- `derivation_type`はcontrolled enum。`remix_note`は表示用short noteで、Analyticsへ送らない。
- Serviceはself-parentとancestor cycleを拒否する。

## Impact semantics

| Metric | Current prototype definition |
|---|---|
| `published_coordinates` | Creatorが現在公開しているACTIVE Coordinate件数 |
| `helpful_count` | 対象Coordinateに現在Helpfulを付けているunique Sessionの合計 |
| `saved_count` | 対象Coordinateに現在存在するSave recordの合計 |
| `plan_started_count` | 対象Coordinateを直接parentとして作成されたPrivate PLAN件数 |
| `public_adaptation_count` | 対象Creator CoordinateをrootとするACTIVE Public derivative件数 |
| `real_room_contributions` | 現在公開中のUSER_DECLARED REAL件数 |

View、Follower、fake popularity countはImpactに含めない。Current countとcumulative event countを混同しない。

## Moderation boundary

Report reasonは`INAPPROPRIATE / PRIVACY / MISLEADING / COPYRIGHT / SPAM / OTHER`だけ。Reportは`OPEN` recordを作るが自動削除しない。Production admin queue、appeal、content review SLAは未実装である。

## External boundary

Product、price、stock、POS、payment、NITORI auth、Room Harmonyはlive接続しない。Room Harmonyは既存のversioned Handoff Previewだけを維持する。
