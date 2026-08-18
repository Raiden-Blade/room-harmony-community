# Final Self-Review — Functional MVP

Review date: 2026-08-18 (JST)

Result: **25 / 25 PASS for Functional MVP acceptance**. This is not a production-readiness or business-impact verdict.

| # | Check | Result | Evidence / correction |
|---:|---|---|---|
| 1 | Primary Targetが新生活・一人暮らし・6畳に明確か | PASS | Home eyebrow / CTA、default discovery、golden case、seasonal collectionを同targetへ統一。 |
| 2 | DomainがTargetだけにHard-codeされていないか | PASS | size 3 bands、need 6、style 6、generic room / housing / household / budget fields。Ranking contextもoptional。 |
| 3 | Instagram Cloneになっていないか | PASS | Infinite feed、Like、Comment、Followを置かず、discovery → structured detail → private PLANを中心にした。 |
| 4 | Product catalog Cloneになっていないか | PASS | Space / problem / match reasonを先に表示。Fake cart、inventory、checkoutなし。 |
| 5 | Existing NITORI assetsを重複実装していないか | PASS | Official search linkのみ。価格・在庫・Map・購入・相談はtruth ownerへ残す。 |
| 6 | Coordinateが中心Domainになっているか | PASS | Coordinate aggregateがNeed / Item / PLAN lineage / provenance / seasonal / creator slotを所有。 |
| 7 | Similar-to-meの理由が説明できるか | PASS | Need、room size、budget等の固定weightと同じ条件から最大4理由を生成。Golden top / reason testあり。 |
| 8 | PLANがProfessional Designと誤認されないか | PASS | `PRIVATE PLAN`、デモ、未承認、購入・在庫確保ではないcopyをDetail / PLAN / Aboutに表示。 |
| 9 | REAL / PLANが明確か | PASS | kind badge、status、visibility、parent linkをData / API / UIで分離。 |
| 10 | Existing Furnitureを扱えるか | PASS | Product ID不要のlabel / category / optional dimensions。購入Totalから除外するunit + E2E test。 |
| 11 | SaveとLikeを混同していないか | PASS | `あとで参考にする`、`参考候補`として扱い、reaction countやLike UIなし。 |
| 12 | Product → Coordinateが動くか | PASS | Product Detailの`この商品を使ったコーデを見る`とAPI integration / frontend / E2E test。 |
| 13 | Coordinate → Multiple Productが動くか | PASS | role付き5商品、2商品Detail閲覧をE2Eで確認。 |
| 14 | Store / EC Actionまで到達できるか | PASS | Official search CTAとgoal-centered Store / Handoff Preview。実購入は行わない。 |
| 15 | Room Harmony Boundaryを守っているか | PASS | Community側contract builderのみ、`live_integration=false`、network callなし。Existing repository unchanged。 |
| 16 | Creator / Emotional Loopが将来拡張可能か | PASS | creator metadata、official pick、seasonal recognition、helpful / saved / adaptation slot、attribution event名を予約。UI actionは未実装。 |
| 17 | Seed画像の権利状態が追跡可能か | PASS | 全Product / Coordinateにrights status。12点のlocal original SVG、validatorでlocal assetを強制。 |
| 18 | Unauthorized User imageをRepositoryへ入れていないか | PASS | 外部image URL禁止validator、asset / Git file auditでlocal SVGのみ確認。 |
| 19 | AnalyticsでH1〜H3を検証できるか | PASS | allowlist Event、anonymous Session、experiment group、readiness endpoint。Free-text property reject test。効果値は表示しない。 |
| 20 | 390px mobileで主要Flowが使えるか | PASS | Chromium 390 / 768 / 1280 test、horizontal overflow 0、tap target ≥44px、visible focus、rendered screenshot review。 |
| 21 | Fresh setupを再現できるか | PASS | tracked commitからtemporary fresh clone。`.venv / node_modules / .demo`無しから自動Install、health / frontend 200まで確認。 |
| 22 | 別Windows PCでも起動可能な前提か | PASS | repo-relative paths、Python 3.11+ / Node 20.19〜24 check、lock / requirements、runtime不足の明示error。実機2台目そのものは未使用。 |
| 23 | Error時にlogから原因を確認できるか | PASS | timestamped stdout / stderr、timeout、port owner表示。Fresh-cloneで発見したPowerShell / Pydantic errorもlogから修正。 |
| 24 | Testが実行済みか | PASS | seed validation、18 pytest、8 Vitest、5 Playwright、production build、npm audit 0 high。 |
| 25 | Fake business resultを表示していないか | PASS | About / readinessでEvent件数は効果・売上改善を示さないと明記。架空countやupliftなし。 |

## Critical findings corrected during review

1. E2E test fileをRepository rootに置くとNode dependency resolutionに失敗したため、`frontend/e2e`へ移し、Vitest収集対象から分離した。
2. 固定Session IDにより再実行時Save stateが残ったため、E2Eごとにunique Sessionを発行した。
3. 他SessionのPrivate PLANをparentとしてcloneできるpathを発見し、404 boundaryとregression testを追加した。
4. Windows PowerShellに`Get-FileHash`がない環境と、missing package importがNativeCommandErrorになるfresh-venv環境を再現し、.NET hash / filesystem dependency checkへ変更した。
5. Pydantic list environment valueのcomma形式をJSON形式へ修正し、root `.env` loadingを明示した。
6. Product価格のsnapshot dateとPLAN totalのdemo recalculation dateをUIへ追加した。

## Verified commands / outcomes

- `backend\.venv\Scripts\python.exe scripts\validate_data\validate_seed.py` → 36 Coordinates / 60 Products PASS
- `backend\.venv\Scripts\python.exe -m pytest -q` → 18 passed
- `npm.cmd run test:run` → 8 passed
- `npm.cmd run build` → production build PASS
- `npm.cmd audit --audit-level=high` → 0 vulnerabilities
- `npm.cmd run test:e2e` → 5 passed (2 primary flows + 3 responsive viewports)
- `start-demo.cmd -NoBrowser` → health OK / frontend 200 / stop ports 0
- fresh clone same launcher → dependencies installed / health OK / frontend 200 / clean Git status / stop ports 0

## Verdict

Functional MVP acceptanceはPASS。Production readiness、NITORI data permission、official Product ID、Room Harmony owner / API、business uplift、moderated user testは未完了であり、次Phaseへ自動進行しない。
