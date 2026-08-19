# Second Physical Windows PC Checklist

Status before execution: **MANUAL_SECOND_PC_TEST_REQUIRED**

Purpose: Codexのfresh-clone simulationとは別に、実際の2台目Windows 10 / 11 PCで約5分の起動・主要Flow・停止確認を行う。実施していない限り`PASS`と記録しない。

## Five-minute check

1. Goal 4 PRのGitHub画面からZIPをDownloadするか、`git clone https://github.com/Raiden-Blade/room-harmony-community.git`後にGoal 4 branch `agent/final-demo-hardening`をcheckoutする。Goal 4 PRは人間がMergeするまでmainへ入っていない。
2. ZIPの場合は右Click → `すべて展開`。ZIP viewer内から直接実行しない。
3. PowerShellまたはCommand Promptで`python --version`を確認する。無い場合は`py -3 --version`を確認し、Python 3.11以上であることを確認する。続けて`node --version`が20.19〜24.x、`npm --version`が表示されることを確認する。
4. Repository直下の`start-demo.cmd`をDouble-clickする。初回Install完了後、Browserで<http://127.0.0.1:5173>が自動表示されることを確認する。
5. Flow A: `条件から参考コーデを探す` → 選んだ条件との一致 → Coordinate Detail → 2商品以上のProduct Detail → ProductからCoordinateへ戻る → `あとで参考にする`を実行する。
6. Flow B: `保存・PLAN` → Private PLAN作成 → 手持ち家具追加 → 商品置換 → Total更新 → `比較準備へ` → `PREVIEW ONLY / live_integration: false`を確認する。
7. Product Detail → `この商品を使ったコーデを見る` → Coordinate → Private PLANが動くことを確認する。
8. `stop-demo.cmd` → `reset-demo.cmd`を実行し、大文字`RESET`を入力する。再起動後、保存・PLAN・試験投稿・Uploadが残らず、Seed画面へ戻ることを確認する。
9. `stop-demo.cmd`をDouble-clickする。
10. PowerShellで次を実行し、8000 / 5173にListenerが残らないことを確認する。

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8000,5173 -ErrorAction SilentlyContinue
```

11. Projectorまたは発表用displayでBrowser zoom 100%にし、Home / Explore / Challenge / Handoffの文字・画像・色が読めることを確認する。
12. 問題が無ければ、PC / Windows version、Python source（`python.exe`または`py.exe -3`）、Python / Node version、display、実施日時と`PASS`をReviewへ記録する。未実施なら`MANUAL_SECOND_PC_TEST_REQUIRED`のままにする。

## If anything fails

Codexへ以下を送る。画面の写真だけでなくtextもCopyする。

- 黒いWindowに表示されたError message
- `.demo\logs\`内の最新`backend-*.err.log`末尾30行
- `.demo\logs\`内の最新`frontend-*.err.log`末尾30行
- `python --version`の結果。失敗する場合は`py -3 --version`の結果
- `node --version`と`npm --version`の結果

Log末尾はRepository直下のPowerShellで取得できる。

```powershell
Get-ChildItem .demo\logs\backend-*.err.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 30
Get-ChildItem .demo\logs\frontend-*.err.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 30
```

他Processがportを使用している場合、LauncherはそのProcessを終了しない。表示されたPIDとApp名も一緒に送る。
