# Goal 3 Final Self-review

Date: 2026-08-19
Branch: `agent/seasonal-growth-loop`
Base: merged Goal 2 main `46cd177f75c2ba0aaeda95c37c07481306bb49cb`
Review target: Seasonal Growth / Challenge Functional Prototype

## Verdict

Goal 3 passed its fresh-clone gate and GitHub CI and is ready for human review. It demonstrates an annual reuse loop without turning the product into a popularity Contest or claiming official NITORI operation, purchase impact, or production readiness.

## Acceptance review

| # | Check | Result | Evidence |
|---:|---|---|---|
| 1 | Seasonal Landing | PASS | `/seasonal`にannual loop、Active、Constraint、Upcoming、Ended、Archiveを表示 |
| 2 | New-life main demo | PASS | 2028 Activeと2027 Archiveを同じThemeで接続 |
| 3 | Challenge lifecycle | PASS | `UPCOMING / ACTIVE / ENDED / ARCHIVED`をAPI・seed・UIで区別 |
| 4 | Structured constraints | PASS | eligibility JSONとdisplay constraintをtyped schemaで検証 |
| 5 | Eligibility enforcement | PASS | room、household、housing、budget、kind、image、Product countをServer検証 |
| 6 | Existing Coordinate Entry | PASS | Challenge専用Postを作らずPublic REAL / PLANを参照 |
| 7 | Ownership | PASS | 他Session、Private、Creatorなし、Hidden / unpublishedを拒否 |
| 8 | Duplicate prevention | PASS | application check + DB unique constraint |
| 9 | Archive reuse | PASS |前年CoordinateをSave / Private PLAN / Adapt可能 |
| 10 | Remix to current Challenge | PASS | Archive → PLAN → Public derivative → 2028 EntryをE2E確認 |
| 11 | Parent / Root lineage | PASS | Goal 2 genealogyをそのまま維持 |
| 12 | Prototype Pick | PASS | controlled recognition、`PROTOTYPE PICK`、非公式説明 |
| 13 | No self-assignment | PASS | Entry requestは`coordinate_id`だけ、extra fieldを拒否 |
| 14 | No popularity leaderboard | PASS | Global順位、Follower、vote、fake engagement countなし |
| 15 | Creator integration | PASS | participation、recognition、seasonal direct reuseを実DB集計 |
| 16 | Goal 2 Impact preserved | PASS | Helpful、Save、PLAN、Public adaptationの既存Flow / testを維持 |
| 17 | Moderation / unpublish | PASS | Hiddenはgallery / count除外、unpublishでEntryを`WITHDRAWN` |
| 18 | Rights / provenance | PASS | repository-local original SVG、DEMO Challenge / Entryのみ |
| 19 | Analytics allowlist | PASS | 10 Seasonal eventとcontrolled identifier / enum property |
| 20 | No business overclaim | PASS | Sales uplift、official campaign、live integrationを明示的に否定 |
| 21 | Goal 1 / Goal 2 regression | PASS | 既存backend / frontend / Playwright Flowを含む全SuiteがPASS |
| 22 | Responsive / visual | PASS | 390 / 768 / 1280、42 screenshots、overflow / overlapなし |
| 23 | Windows launcher | PASS | working treeでone-click start、health、frontend、owned stop |
| 24 | Fresh clone | PASS | `5e71f60`から新規cloneし、first-run install / launch / Seasonal API / owned stopを確認 |
| 25 | GitHub CI | PASS | PR #3のbackend / frontend jobがPASS |

## Domain and data semantics

- `Coordinate` remains the aggregate root. `ChallengeEntry` stores participation, not duplicated content.
- Challenge status is explicit prototype state. There is no scheduler that derives state from the current clock.
- Entry count and REAL / PLAN breakdown are current visible SQLite records. Seed does not contain stored popularity, view, like, or rank counts.
- Recognition is a controlled enum. Seed assignment is displayed as Prototype Pick and cannot be supplied by the public Entry API.
- Bundled data contains 36 synthetic Coordinates, 60 `DEMO-*` Products, 6 Demo Challenges, and 8 Demo Entries.

## Verification evidence before PR

- Seed / rights / eligibility validation: `36 Coordinates / 60 Products / 6 Challenges / 8 Entries`, PASS.
- Backend: `54 passed`.
- Frontend behavior: `18 passed`.
- Browser: 8 functional flows + 3 responsive checks, `11 passed`.
- Production build: TypeScript + Vite, PASS.
- Dependency checks: `npm audit --audit-level=high` = 0 vulnerabilities; `pip check` = no broken requirements.
- Visual QA: 14 surfaces × 390 / 768 / 1280 = 42 rendered screenshots inspected. Seasonal categories were de-duplicated and desktop Challenge grid was adjusted to avoid a dense or visually unbalanced layout.
- Working-tree launcher: backend health、frontend response、owned process stop、ports 8000 / 5173 release, PASS.
- Fresh clone from `5e71f60`: no pre-existing venv / node_modules / DB、first-run Python + Node install、backend `status=ok`、frontend HTTP 200、2 Active / 2 Upcoming / 1 Ended / 1 Archived、seed entry counts 3 / 3、owned stop、clean tracked worktree, PASS.

## Safety and trust boundary

- All Challenge / Entry seed records use `DEMO` provenance. They do not impersonate a real User, employee, designer, or official campaign.
- Images are existing locally created SVG assets; no Instagram、NITORI UGC、product image scrape、or remote fetch was added.
- User-contributed image handling remains Goal 2's decode / normalize / EXIF removal boundary.
- Recognition gives no Coupon、Point、Cash、Gift、or Product reward.
- Challenge Entry does not bypass Report / moderation / unpublish behavior.
- Analytics rejects free text and only stores allowlisted event / property / enum / identifier values.

## Known limitations accepted for Goal 3

- Anonymous Browser Session is prototype ownership, not authentication or account recovery.
- Challenge status does not transition automatically by date; a production scheduler / admin workflow is not implemented.
- Prototype Pick is seed-controlled; there is no employee review console, approval audit, appeal, or notification workflow.
- SQLite create-table / local upgrade is not a production migration framework.
- Repeated E2E runs retain ignored local test data, so assertions bind to the newly created Coordinate rather than assuming a globally empty gallery.
- No real NITORI catalog、price、inventory、POS、order、store、member、map、or Room Harmony connection exists.
- No public deployment、load / concurrency validation、assistive-technology user audit、or business uplift evidence exists.
- Second physical Windows PC remains `MANUAL_SECOND_PC_TEST_REQUIRED`.

## Human review before Goal 4

1. Confirm whether Challenge remains a secondary Home / Seasonal route or earns top-level navigation after real usage evidence.
2. Approve the exact production eligibility vocabulary and who may change it.
3. Define staff Recognition workflow, disclosure wording, audit trail, removal, and dispute handling.
4. Define moderation SLA for a Coordinate that is already featured in an active or archived Challenge.
5. `direct_seasonal_reuse_count`はChallenge参加コーデからの直接の派生だけを数え、Private / Public・同一User / 他Userを区別しない。正式KPI化には分母と対象範囲の再定義が必要。
6. Define year rollover, Archive timing, timezone, and automated status transition ownership.
7. Validate the funnel denominator for eligible Coordinate → Entry and the cohort logic for prior-year → PLAN → current Entry.
8. Run the documented second physical Windows PC checklist.
9. Do not start rewards, leaderboard, production auth, real data import, live integration, or deployment without a separate Goal and approvals.
