# Goal 2 DB to Goal 3 DB

## Normal path

既存Goal 2利用者はDBを削除せず、Repository rootで`start-demo.cmd`を実行する。

起動時にSQLAlchemyが次のTableを追加する。

- `challenges`
- `challenge_entries`

その後`seed_seasonal_if_empty`がChallengeが0件の場合だけ`data/seed/seasonal_seed.json`を投入する。Goal 2のProduct、Coordinate、Creator、Helpful、Save、PLAN、lineage、Uploadは削除・再Seedしない。

## Verification

起動後に次を確認する。

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/api/seasonal
```

Browserでは次を確認する。

- <http://127.0.0.1:5173/seasonal>
- <http://127.0.0.1:5173/challenges/new-life-6tatami-2028>
- <http://127.0.0.1:5173/challenges/new-life-6tatami-2027>

## Backup and rollback boundary

Local Prototypeでも更新前に停止し、`.demo/*.db`をRepository外の明示した場所へCopyすることを推奨する。自動Rollback / Alembic migrationはない。

完全Resetを自分で選ぶ場合だけ、`stop-demo.cmd`でowned processを停止し、対象の`.demo` DBを確認してから削除する。通常の更新でDB削除は不要である。

## Known limits

- statusはDB保存値で、日時による自動更新はしない。
- bundled Demo Entryはexisting synthetic Coordinateを参照する。
- Production DB migration、authentication、real moderation workflowは別Goalで設計する。
