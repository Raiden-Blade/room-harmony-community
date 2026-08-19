# Room Harmony Community

「新生活 × 一人暮らし × 6畳」を入口に、暮らしのCoordinateを**探す → 保存 / 参考になった → Private PLANへAdapt → Public PLAN / REAL ROOMとして再共有 → Creatorへ役立ちを返す**ところまで動かせるFunctional Prototypeです。

> 商品を一つずつ売るUIではなく、「なぜこの組み合わせが自分の暮らしに合うか」を理解し、手持ち家具も残しながら次の行動へ進めるかを検証します。

## Current status / Goal 4

2026-08-19時点で、Goal 1のPlanning / Commerce、Goal 2のCreator / Community、Goal 3のSeasonal Growthを一つのLocal Functional Prototypeとして維持し、Goal 4で最終Demo向けの信頼性・画面品質・Reset・Error recoveryを強化しました。Goal 4Bでは、主要15件のCoordinate画像を使用許可確認済みのNITORI公式参照画像へ差し替え、ローカル実行・出典追跡・SVG fallbackを維持しています。これは、暮らしの事例を「見る」だけで終わらせず、自分向けPLANへ変え、店舗・ECで実現する準備をし、REAL ROOMとして次の人へ循環させるCoordinate Platformです。Seasonal ChallengeはCoreではなく、前年事例を再発見するGrowth Layerです。

本Prototypeは年間reuse loopとmulti-product explorationを操作・計測可能にしますが、Production効果、併売率・売上・購入率の向上、NITORIによる公式採用・選定、NITORI / Room Harmonyとの実接続は証明していません。

## いちばん簡単な起動方法（Windows）

1. このRepositoryをZIPでDownloadし、**ZIPを展開**します。
2. [Python 3.11以上](https://www.python.org/downloads/windows/)と[Node.js 20.19〜24.x](https://nodejs.org/)が未Installなら先にInstallします。GitはZIP利用では不要、`git clone`する場合はGit 2.xが必要です。Launcherは利用可能な`python.exe`を優先し、無ければWindows Python Launcherの`py.exe -3`を確認します。
3. Repository直下の`start-demo.cmd`をDouble-clickします。
4. 初回のみPython / Node依存関係が自動Installされ、Health check後にブラウザが開きます。

起動後:

- App: <http://127.0.0.1:5173>
- API health: <http://127.0.0.1:8000/health>
- Swagger / OpenAPI: <http://127.0.0.1:8000/docs>
- 終了: `stop-demo.cmd`をDouble-click
- 発表前の初期化: `reset-demo.cmd`をDouble-clickし、確認欄へ大文字で`RESET`と入力してから再度`start-demo.cmd`

LauncherはPython / virtualenv / Node version、依存関係、8000 / 5173 port、owned process、backend health、frontend応答を確認し、120秒でTimeoutします。失敗時は`.demo/logs/`の場所と原因を表示します。ZIP内から直接実行、Microsoft Store alias、Python / Node不足、古いvirtualenv、他Processによるport使用は自動で隠さず、修正方法を表示します。

別Physical Windows PCでの確認はまだ自動検証と分けて扱います。Merge前の5分確認は[`docs/operations/second-pc-checklist.md`](docs/operations/second-pc-checklist.md)を使用してください。現在の状態は`MANUAL_SECOND_PC_TEST_REQUIRED`です。

## Primary Demo 4本

### Demo 1 — Similar-to-me → PLAN → 店舗比較Preview

Home → `6畳のおすすめを見る` → 条件に近いCoordinate → 商品 → 保存 → Private PLAN → 商品の置換 / 手持ち家具 → 概算 → 店舗比較 → Handoff Preview。

### Demo 2 — Creator / Community reuse

画像付きREAL ROOMを公開 → 別Sessionで`参考になった` / 保存 → 自分向けにアレンジ → Public derivative → 元Creatorの役立ち指標を確認。

### Demo 3 — 前年Archive → Current Challenge

Seasonal → `新生活の6畳 2027` Archive → 前年REAL → Private PLAN → Public derivative → `新生活の6畳 2028`へ参加。Challengeは人気Contestではなく、条件付きの再利用導線です。

### Demo 4 — Product reverse discovery

Product Detail → `この商品を使ったコーデを見る` → Coordinate → Private PLAN。

5〜8分のClick順、説明、Failure時のFallbackは[`docs/operations/demo-script.md`](docs/operations/demo-script.md)を使用してください。Handoffは**接続前Preview only**で、既存Room HarmonyやNITORI内部Systemへ通信しません。

## 実装Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React 18 / TypeScript / Vite / React Router | 13 route screens、Creator / Seasonal UI、responsive UI、typed API client |
| Backend | Python 3.11+ / FastAPI / Pydantic / SQLAlchemy / Pillow | ranking、Save / PLAN、Creator、lineage、Seasonal eligibility / Entry、safe image normalization |
| Data | SQLite + generated JSON seed + ignored local uploads | anonymous Session ownership、36 Coordinates、60 Products、6 Challenges、8 Entries、User contributions |
| Test | pytest / Vitest / Testing Library / Playwright | 54 backend tests、24 frontend tests、9 functional browser flows、3 responsive checks |

Backendはruntime OpenAPIを`/openapi.json`で公開し、Frontendは[`frontend/src/api/types.ts`](frontend/src/api/types.ts)のTypeScript contractと[`frontend/src/api/client.ts`](frontend/src/api/client.ts)を通してだけ接続します。

## Repository structure

```text
room-harmony-community/
├── frontend/        React UI、typed API client、Vitest、Playwright
├── backend/         FastAPI、domain / service / repository、pytest
├── data/seed/       generated synthetic demo dataset
├── docs/            Phase 0定義 + implementation / runbook / decisions
├── scripts/         seed / validation / launcher helpers
├── start-demo.cmd   Windows one-click start
├── stop-demo.cmd    owned processes only stop
└── reset-demo.cmd   confirmed local demo-data reset
```

## Dataと権利の境界

- 36件のCoordinate、60件のProduct、商品構成、価格、投稿者情報は架空の機能検証Dataです。
- Product IDは`DEMO-*`であり、NITORI SKUではありません。
- Main Demoの15 Coordinateには、Userが本Prototypeでの使用許可を確認したNITORI公式「新生活用品」Coordinate参照画像をローカルWebPとして同梱しています。一般的なOpen licenseを意味せず、転載・再利用範囲を拡張するものではありません。
- NITORI由来なのは上記の**部屋・Coordinate参照画像だけ**です。`DEMO-*`商品ID、商品画像、価格、商品構成はNITORIの商品Masterではなく、引き続き架空またはRepository-originalです。
- 残りのCoordinate、Home、ProductにはRepository-original SVGを使い、主要15件の個別SVGと共通`room-fallback.svg`も読み込み失敗時の安全策として保持します。Runtime hotlinkはありません。
- 価格は`デモ価格スナップショット`と明示し、未取得価格は0円にせず件数を表示します。
- 外部URLはNITORI公式検索ページへの参考Linkで、在庫・Cart・購入・価格APIではありません。
- REAL / PLAN、Official / Staff / User declaredは将来のData modelを示す架空例で、公式認定や実在投稿を意味しません。
- Goal 2でUserがUploadした画像は`.demo/uploads/`へrandom filenameのWebPとしてLocal保存され、Git対象外です。元filename、client path、EXIFは保存しません。
- `USER_DECLARED` REALはUser申告であり、NITORIまたはSystemによる本人・購入・実在性の確認済み情報ではありません。
- 6件のChallengeと8件のEntryも架空のSeasonal seedです。`Prototype Pick`はDemo上のcontrolled recognitionで、NITORI社員による公式選定、人気順位、品質保証ではありません。
- Challenge参加数とREAL / PLAN内訳はcurrent SQLiteから計算し、fake view / like / rank countを保存しません。

画像ごとの対応は[`data/seed/visual_asset_manifest.json`](data/seed/visual_asset_manifest.json)、選定理由とfallbackは[`docs/operations/visual-asset-plan.md`](docs/operations/visual-asset-plan.md)、出典は[`docs/sources/source-links.md`](docs/sources/source-links.md)を参照してください。

## 推薦の意味

`あなたに近い`はAI / LLMではありません。Room size、Need、Budget、Room / Housing / Household、Style、手持ち家具との相性を固定weightで採点し、同点時もID順で決まるdeterministic rankingです。表示理由も同じ一致条件から生成します。`編集部ピック`はH1比較用のPopular / editorial baselineです。

このMVPは併売率や売上改善を証明しません。H1〜H3の操作EventとUser選択の`comparison_condition`を蓄積し、「次に正式なUser testで何を比較できるか」を示します。Randomized assignment、sticky group、sample-size設計、統計解析は未実装です。

## 開発者向け起動

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

`python.exe`が無く`py.exe`のみ利用できるWindowsでは、最初の行を`py -3 -m venv .venv`に置き換えます。

Frontend（別Terminal）:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

## Goal 1 / Goal 2 DB → Goal 3 DB

通常はそのまま`start-demo.cmd`を実行してください。起動時に[`backend/app/core/schema.py`](backend/app/core/schema.py)が既存SQLiteへGoal 2列を追加し、SQLAlchemyがGoal 2 / Goal 3 Tableを作成します。Seasonal seedはChallengeが空の場合だけ独立投入し、既存Product、Coordinate、Creator、Save、PLAN、lineageは削除・再Seedしません。

更新前に`.demo/*.db`を別場所へCopyすることを推奨します。これは小規模Local Prototype向けのdeterministic upgradeであり、Production migration frameworkではありません。発表用に完全Resetする場合は`reset-demo.cmd`を使ってください。Repository内の既知Demo DB / Uploadだけを削除し、source、logs、visual QA screenshotは保持します。詳細は[`Goal 1 → Goal 2`](docs/operations/goal1-to-goal2-migration.md)と[`Goal 2 → Goal 3`](docs/operations/goal2-to-goal3-migration.md)です。

## Test / Validation

```powershell
# Seed schema / rights / count
backend\.venv\Scripts\python.exe scripts\validate_data\validate_seed.py

# Backend unit + API + OpenAPI contract
backend\.venv\Scripts\python.exe -m pytest -q

# Frontend behavior + production build + dependency audit
cd frontend
npm.cmd run test:run
npm.cmd run build
npm.cmd audit --audit-level=high

# Real Chromium flows + 390 / 768 / 1280 responsive checks
npm.cmd run test:e2e
```

Visual QA captureは`frontend`で`npm.cmd run qa:visual`を実行すると、Main Demoとは別のtemporary DB / port 8100 / 5174を使って`.demo/visual-qa/`へ出力されます。終了時にtemporary dataとowned processだけを削除します。

Pull Requestでは`.github/workflows/ci.yml`がbackend tests、frontend tests、frontend production buildを実行します。Playwright、Windows launcher、fresh-clone、別Physical PCはlocal / manual gateとして分離します。

## Repository boundary

本Repositoryは既存[Room Harmony](https://github.com/Raiden-Blade/room-harmoney)から意図的に分離しています。

- Community: Coordinate discovery / Save / PLAN / Adapt / Seasonal collection
- Room Harmony: QR / Product recommendation / Guided Chat / Store route / Visit session
- 接点: versioned Handoff previewのみ

既存`room-harmoney`のcode、branch、data、runtimeは変更していません。

## MVPに含まれないもの

- Generic Like、Comment、Follow、DM、Notification、Following Feed、Leaderboard、vote Contest、reward
- AI / LLM / image recognition
- 本物のNITORI商品・価格・在庫・POS・決済・店内Map
- Production authentication / deployment
- Live Room Harmony integration

Documentationの入口は[`docs/index.md`](docs/index.md)、実装構造は[`docs/architecture/implementation.md`](docs/architecture/implementation.md)、起動Troubleshootingは[`docs/operations/demo-runbook.md`](docs/operations/demo-runbook.md)です。
