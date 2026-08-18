# Windows Demo Runbook

## Audience

Git / Python / npm commandに慣れていないReviewerが、ZIP展開後に同じDemoを再現するための手順。

## Prerequisites

- Windows 10 / 11
- Python 3.11以上（usable `python.exe`、またはWindows Python Launcherの`py.exe -3`）
- Node.js 20.19〜24.x + npm
- Git 2.x（clone利用時のみ。ZIP利用では不要）
- 初回依存関係Install時のみInternet connection
- localhost port 8000 / 5173が空いていること

## Start

1. ZIPを右Clickし`すべて展開`。ZIP viewer内からは実行しない。
2. 展開Folder直下の`start-demo.cmd`をDouble-click。
3. `Room Harmony Community is ready.`を待つ。
4. Browserが開かない場合は<http://127.0.0.1:5173>を手動で開く。

Install済みの依存関係はlock / requirements hashで再利用する。Backend / Frontend process IDは`.demo/processes.json`へ保存する。

Python discoveryはusable `python.exe` → `py.exe -3` → explicit failureの順で行う。Microsoft Store aliasやPython 3.10以下は理由を表示して次候補へ進む。Virtual environment作成とdependency installは選択されたInterpreter系統から作った`backend/.venv`を使用し、既存venvのversionも再確認する。

## Stop

`stop-demo.cmd`をDouble-clickする。記録されたPIDのcommand lineがこのRepository pathを含む場合だけ停止する。他ProjectのPython / Node processは停止しない。

## Reset before a presentation

1. `reset-demo.cmd`をDouble-clickする。
2. 表示された絶対pathがこのRepositoryの`.demo`であることを確認する。
3. 大文字で`RESET`と入力する。
4. Seed validation完了後に`start-demo.cmd`をDouble-clickする。

Resetはlauncher-owned processを安全に停止し、`.demo/room-harmony-community.db`、known E2E / visual-QA residue、`.demo/uploads`だけを削除する。Save、Helpful、Private PLAN、Creator、Public Coordinate、local upload、Challenge Entry、AnalyticsはSeed状態へ戻る。Source、tracked assets、`.demo/logs`、`.demo/visual-qa`、Repository外file、unmanaged processは変更しない。`-Force`は自動検証用であり、通常の発表準備ではconfirmation付きDouble-clickを使う。

## Common failures

| Message / symptom | Meaning | Action |
|---|---|---|
| Black window closes immediately | ZIP内実行、runtime不足、旧launcher等 | 展開後に再実行。失敗時はwindowを閉じずmessageを読む |
| `No usable Python 3.11+ runtime was found` | `python.exe` / `py.exe -3`が無い、Store aliasのみ、またはversion不足 | Python 3.11+とPython LauncherをInstallし、windowを開き直す |
| `backend\.venv ... cannot run / uses Python ...` | 既存venvが破損または古い | Repository内の`backend\.venv`だけを削除して再実行 |
| `Node.js ... unsupported` | Node versionがVite要件外 | Node 20 LTS〜24へ変更 |
| `Port 8000/5173 is already in use` | 別Serverまたは前回Process | `stop-demo.cmd`、または表示されたPIDのAppを終了 |
| Package installation failed | Network / proxy / permission | Network確認後に再実行。`backend/.venv`や`node_modules`を手動削除しない |
| Health timeout | Backend / Frontend crash | `.demo/logs/*err.log`の末尾を確認 |
| Page opens but data is blank | Backend unavailable | <http://127.0.0.1:8000/health>が`status: ok`か確認 |
| Save / Helpful / Challengeが既に操作済み | 前のDemo Session / DBが残っている | `stop-demo.cmd` → `reset-demo.cmd` → `start-demo.cmd` |
| Reset refuses to continue | 8000 / 5173にunmanaged listenerがある | 表示されたPIDのAppを確認し、自分で終了してから再実行。Resetは強制終了しない |

## Manual health checklist

- `/health` returns `{"status":"ok","dataset":"synthetic-demo"}`
- `/docs` lists catalog / saved / plans / analytics
- Home says `機能検証用デモ`
- Product IDs use `DEMO-*`
- Handoff says `PREVIEW ONLY` and `live_integration: false`
- Main Demo Coordinateが同じroom imageの連続表示になっていない
- Stop leaves no listener on port 8000 / 5173

## Clean-room acceptance

Release前はtemporary directoryへfresh cloneし、venv / node_modules / `.demo`が無いtracked fileだけの状態から`start-demo.cmd -NoBrowser`を実行する。Health check、Home 200、Demo 1 sanity、Seasonal API、`stop-demo.cmd`、port解放、tracked worktree cleanまで確認する。

これは別Physical PCの確認ではない。別PCは[`second-pc-checklist.md`](second-pc-checklist.md)を使い、未実施なら`MANUAL_SECOND_PC_TEST_REQUIRED`と記録する。
