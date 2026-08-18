# Windows Demo Runbook

## Audience

Git / Python / npm commandに慣れていないReviewerが、ZIP展開後に同じDemoを再現するための手順。

## Prerequisites

- Windows 10 / 11
- Python 3.11以上（Microsoft Store aliasではなくcommandから実行可能）
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

## Stop

`stop-demo.cmd`をDouble-clickする。記録されたPIDのcommand lineがこのRepository pathを含む場合だけ停止する。他ProjectのPython / Node processは停止しない。

## Common failures

| Message / symptom | Meaning | Action |
|---|---|---|
| Black window closes immediately | ZIP内実行、runtime不足、旧launcher等 | 展開後に再実行。失敗時はwindowを閉じずmessageを読む |
| `python.exe was not found` | Python未Install / PATH未反映 | Python 3.11+をInstallし、windowを開き直す |
| `Node.js ... unsupported` | Node versionがVite要件外 | Node 20 LTS〜24へ変更 |
| `Port 8000/5173 is already in use` | 別Serverまたは前回Process | `stop-demo.cmd`、または表示されたPIDのAppを終了 |
| Package installation failed | Network / proxy / permission | Network確認後に再実行。`backend/.venv`や`node_modules`を手動削除しない |
| Health timeout | Backend / Frontend crash | `.demo/logs/*err.log`の末尾を確認 |
| Page opens but data is blank | Backend unavailable | <http://127.0.0.1:8000/health>が`status: ok`か確認 |

## Manual health checklist

- `/health` returns `{"status":"ok","dataset":"synthetic-demo"}`
- `/docs` lists catalog / saved / plans / analytics
- Home says `機能検証用デモ`
- Product IDs use `DEMO-*`
- Handoff says `PREVIEW ONLY` and `live_integration: false`
- Stop leaves no listener on port 8000 / 5173

## Clean-room acceptance

Release前はtemporary directoryへfresh cloneし、tracked fileだけの状態から`start-demo.cmd -NoBrowser`を実行する。Health check、Home 200、`stop-demo.cmd`、port解放まで確認する。
