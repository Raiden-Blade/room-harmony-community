# Goal 1 SQLite → Goal 2 Local Migration

## Scope

これはLocal Functional PrototypeのSQLite upgradeであり、Production migration systemではない。Goal 1のProduct、Coordinate、Save、Private PLAN、Analyticsを保持しながらGoal 2を起動するための手順である。

## Normal path

1. `stop-demo.cmd`でowned processを停止する。
2. 任意だが推奨: `.demo/*.db`をRepository外へCopyする。
3. 最新branchで`start-demo.cmd`を実行する。
4. Backend startupが新Tableを作成し、既存`coordinates`へ不足Columnを追加する。
5. <http://127.0.0.1:8000/health> とAppを確認する。

追加されるCoordinate fields:

- `creator_id`
- `root_coordinate_id`
- `derivation_type`
- `remix_note`
- `moderation_status`
- `published_at`
- `unpublished_at`

新Table:

- `creator_profiles`
- `coordinate_images`
- `helpful_reactions`
- `content_reports`

既存Public Coordinateは`moderation_status = ACTIVE`、空の`root_coordinate_id = id`へbackfillする。既存Rowを削除・再作成しない。

## Verification

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q tests\unit\test_schema_upgrade.py
```

App上ではGoal 1のExplore、Saved、Private PLANが残り、新Navigationの`つくる・投稿`が開くことを確認する。

## Reset is destructive and optional

完全なsynthetic demo resetを自分で選ぶ場合だけ、停止後に対象の`.demo/*.db`と`.demo/uploads/`を削除して再起動する。これは既存Local Save / PLAN /投稿を失うため、通常のupgrade手順ではない。

## Limitations

SQLiteの`ALTER TABLE ADD COLUMN`を使うため、既存Tableへ新Foreign Key constraintを後付けしない。Prototype service layerとtestsでownership / lineage integrityを検証する。Productionへ進む場合はversioned migration framework、transactional rollback、backup policy、admin moderationを別途設計する。
