# Final Self-Review — Goal 1.5 Merge Gate

Review date: 2026-08-18 (JST)

Current result: **AUTOMATED GATE PASS / FRESH CLONE PENDING**. This is not a production-readiness, official-integration, or business-impact verdict. A second physical Windows PC remains a separate manual check.

| # | Check | Result | Evidence / correction |
|---:|---|---|---|
| 1 | Primary Targetが新生活・一人暮らし・6畳に明確か | PASS | Home CTA、default discovery、golden case、seasonal collectionを同targetへ統一。 |
| 2 | DomainがTargetだけにHard-codeされていないか | PASS | size 3 bands、need 6、style 6、generic room / housing / household / budget fields。Ranking contextもoptional。 |
| 3 | Instagram Cloneになっていないか | PASS | Infinite feed、Like、Comment、Followを置かず、discovery → structured detail → private PLANを中心にした。 |
| 4 | Product catalog Cloneになっていないか | PASS | Space / problem / match reasonを先に表示。Fake cart、inventory、checkoutなし。 |
| 5 | Existing NITORI assetsを重複実装していないか | PASS | Official search linkのみ。価格・在庫・Map・購入・相談はtruth ownerへ残す。 |
| 6 | Coordinateが中心Domainになっているか | PASS | Coordinate aggregateがNeed / Item / PLAN lineage / provenance / seasonal / creator slotを所有。 |
| 7 | Similar-to-meの理由が説明できるか | PASS | Need、room size、budget等の固定weightと同じ条件から最大4理由を生成。Weight別・tie-break・golden top testあり。 |
| 8 | PLANがProfessional Designと誤認されないか | PASS | `PRIVATE PLAN`、デモ、未承認、購入・在庫確保ではないcopyをDetail / PLAN / Aboutに表示。 |
| 9 | REAL / PLANが明確か | PASS | kind badge、status、visibility、parent linkをData / API / UIで分離。Bundled Staff PLANはsynthetic public example。 |
| 10 | Existing Furnitureを扱えるか | PASS | Product ID不要のlabel / category / optional dimensions。購入Totalから除外するunit + E2E test。 |
| 11 | SaveとLikeを混同していないか | PASS | `あとで参考にする`、`参考候補`として扱い、reaction countやLike UIなし。 |
| 12 | Product → Coordinateが動くか | PASS | Product Detailの`この商品を使ったコーデを見る`とAPI integration / frontend / E2E test。 |
| 13 | Coordinate → Multiple Productが動くか | PASS | role付き5商品、2商品Detail閲覧をE2Eで確認。 |
| 14 | Store / EC Actionまで到達できるか | PASS | Official search CTAとgoal-centered Handoff Preview。実購入・店舗在庫照会・live handoffは行わない。 |
| 15 | Room Harmony Boundaryを守っているか | PASS | Community側contract builderのみ、`live_integration=false`、network callなし。Existing repository unchanged。 |
| 16 | Creator / Emotional Loopが将来拡張可能か | PASS | creator metadata、official pick、seasonal recognition、helpful / saved / adaptation slot、attribution event名を予約。Public UGC actionは未実装。 |
| 17 | Seed画像の権利状態が追跡可能か | PASS | 全Product / Coordinateにrights status。12点のlocal original SVG。Validatorがasset path traversalと外部imageを拒否。 |
| 18 | Official URLが制御されているか | PASS | Validatorが`https://www.nitori-net.jp/ec/search/...`のexact host / pathを強制。User inputをredirectに使用しない。 |
| 19 | Analyticsで次の検証準備ができるか | PASS | allowlist Event、controlled enum / integer、anonymous Session、readiness endpoint。`comparison_condition`はUser選択でありA/B割当ではない。 |
| 20 | Analyticsが行動を二重計上しないか | PASS | Handoff Previewは`room_harmony_handoff_preview`だけを発火し、live actionとして数えない。 |
| 21 | Private PLAN boundaryを守るか | PASS | Cross-session read / list / save / clone / mutate / ready / handoffを404で遮断。Responseからowner Session IDを除外。 |
| 22 | 390px mobileで主要Flowが使えるか | PASS | Chromium 390 / 768 / 1280 test、horizontal overflow 0、tap target 44px以上、visible focus、15 rendered screenshots review。 |
| 23 | Windows launcherが安全に起動・停止できるか | PASS | `python.exe` / `py.exe -3` fallback、venv再検証、owned PID、unmanaged port refusal、stale state、port releaseを確認。 |
| 24 | Fresh setupを再現できるか | PENDING | Final tracked commitから`.venv / node_modules / .demo`無しのtemporary cloneを作り、Install → health → flow smoke → stopを再確認する。 |
| 25 | 別Physical Windows PCで確認したか | MANUAL_REQUIRED | 実機2台目そのものは未使用。`docs/operations/second-pc-checklist.md`を使用し、未実施をPASSと表現しない。 |

## Critical findings corrected during Goal 1.5

1. Architecture docsの旧module path、旧handoff route、README screen count、AGENTS project phaseを現実装へ同期した。
2. Windows launcherが`python.exe`だけを前提としていたため、usable Python判定、`py.exe -3` fallback、既存venv version checkを追加した。
3. User-selected modeを`experiment_group`と呼び、`newlife`を`popular`へ誤分類していたため、公開contractを`comparison_condition`へ変更した。
4. Handoff Previewがlive actionと二重計上されていたため、preview専用Event 1件だけへ修正した。
5. Analytics allowlist内の文字列が実質free textを許していたため、enum / integer range / controlled IDへ制限した。
6. Private PLANのSave APIが存在を`false`で漏らし、responseがowner Session IDを返していたため、404 boundaryとresponse最小化を追加した。
7. HandoffのStore ID / return URLが広すぎたため、Demo Store IDとlocal pathだけに制限した。
8. Stop launcherがstale PID `0`をWindows Idle Processとして扱う場合があったため、non-positive PIDを無視し、停止後のport releaseを確認するよう修正した。
9. Saved / PLAN editの失敗時にErrorが見えず、formが先に消える場合があったため、失敗表示と成功後resetへ修正した。
10. E2Eの広いheading selectorが同名要素を複数matchしてflakyになったため、URLとunique level-1 headingで確認するよう修正した。

## Verified commands / outcomes before fresh-clone gate

- `backend\.venv\Scripts\python.exe scripts\validate_data\validate_seed.py` → 36 Coordinates / 60 Products PASS
- `backend\.venv\Scripts\python.exe -m pytest -q` → 33 passed
- `npm.cmd run test:run` → 8 passed
- `npm.cmd run build` → production build PASS
- `npm.cmd audit --audit-level=high` → 0 vulnerabilities
- `npm.cmd run test:e2e` → 5 passed（2 primary flows + 3 responsive viewports）
- `npm.cmd run qa:visual` → 15 screenshots（5 screens × 3 viewports）rendered and reviewed
- `start-demo.cmd -NoBrowser` → health OK / frontend 200 / repeated start detection / stop ports released
- simulated `py.exe -3`-only PATH → fallback start / health / stop PASS
- missing runtime / unmanaged 8000 / unrelated PID / stale state checks → explicit failure or safe cleanup PASS
- Markdown local links → 29 files PASS; CI YAML / PowerShell syntax PASS

## Pending final evidence

- Final tracked commitからのfresh clone install / startup / API flow smoke / shutdown / clean status
- GitHub Actions backend / frontend jobs after push
- Second physical Windows PC remains `MANUAL_SECOND_PC_TEST_REQUIRED`

## Provisional verdict

Local automated checks are green. `READY_FOR_HUMAN_MERGE` is not assigned until the final fresh-clone gate and GitHub Actions pass. Production readiness、NITORI data permission、official Product ID、Room Harmony owner / API、business uplift、moderated user testは未完了であり、次Phaseへ自動進行しない。
