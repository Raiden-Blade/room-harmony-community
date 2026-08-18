# Room Harmony Community

「新生活 × 一人暮らし × 6畳」を入口に、暮らしのCoordinateを**探す → 保存 / 参考になった → Private PLANへAdapt → Public PLAN / REAL ROOMとして再共有 → Creatorへ役立ちを返す**ところまで動かせるFunctional Prototypeです。

> 商品を一つずつ売るUIではなく、「なぜこの組み合わせが自分の暮らしに合うか」を理解し、手持ち家具も残しながら次の行動へ進めるかを検証します。

## Current status / Goal 3

2026-08-19時点で、Goal 1のFunctional MVPとGoal 2 Creator & Community Loopを維持したまま、Goal 3 Seasonal Growth Loopを追加しました。既存Public REAL / PLANをstructured条件でChallengeへ参加させ、前年Archive → Private PLAN → Public derivative → Current ChallengeをParent / Root lineage付きで再利用できます。参加数、REAL / PLAN内訳、Creator seasonal impactは実DB値です。これは年間reuse loopを操作・計測可能にするPrototypeであり、Production効果、併売率向上、公式選定、NITORI / Room Harmony接続は未検証です。

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

LauncherはPython / virtualenv / Node version、依存関係、8000 / 5173 port、owned process、backend health、frontend応答を確認し、120秒でTimeoutします。失敗時は`.demo/logs/`の場所と原因を表示します。ZIP内から直接実行、Microsoft Store alias、Python / Node不足、古いvirtualenv、他Processによるport使用は自動で隠さず、修正方法を表示します。

別Physical Windows PCでの確認はまだ自動検証と分けて扱います。Merge前の5分確認は[`docs/operations/second-pc-checklist.md`](docs/operations/second-pc-checklist.md)を使用してください。現在の状態は`MANUAL_SECOND_PC_TEST_REQUIRED`です。

## Demoで確認する7つのFlow

### Flow A — Discovery / Save

1. Homeの`6畳のおすすめを見る`
2. 部屋・困りごと・予算を選ぶ
3. `あなたに近い理由`を確認
4. Coordinate Detailから複数商品を見る
5. Product Detailから使用Coordinateへ戻る
6. `あとで参考にする`

### Flow B — Private PLAN / Action

1. `保存・PLAN`から保存したCoordinateを開く
2. `自分向けに変更する`
3. 商品を`残す / 別の商品に変更 / 追加`
4. 手持ち家具を追加（購入Totalには含めない）
5. Totalを確認して`比較準備へ`
6. Room Harmony Handoff payload Previewを確認

### Flow C — Creator contribution

1. Navigationの`つくる・投稿`
2. 公開用表示名を作る（Authenticationではありません）
3. `REAL ROOM`または`PLAN`を明確に選ぶ
4. Room条件、商品、手持ち家具を入力
5. REALの場合はJPEG / PNG / WebP画像をUpload
6. 公開後、Coordinate DetailとCreator Profileを確認

### Flow D — Community reuse

1. 別Browser SessionでPublic Coordinateを開く
2. `参考になった`と`あとで参考にする`を別Intentとして操作
3. `このコーデを自分向けにアレンジ`
4. Private PLANで商品置換、追加、手持ち家具を調整

### Flow E — Re-share / Impact

1. Private PLANから`公開コーデとして共有`
2. 実現前ならPLAN、実現後なら画像付きREALを選ぶ
3. Structuredな変更理由を指定
4. Detailの参考元 / Root / 公開派生を確認
5. 元Creator ProfileでHelpful、Save、PLAN開始、公開派生を確認

### Flow F — Seasonal Challenge participation

1. HomeのSeasonal CTAから`/seasonal`へ進む
2. Active / Constraint / Upcomingと前年Archiveの違いを確認
3. Active Challengeで理由、structured条件、実DBのREAL / PLAN内訳を見る
4. 既存の自分のPublic Coordinateで参加、またはChallenge条件付きCreateを開く
5. Entry後、Challenge galleryとCreator Profileのseasonal participationを確認

### Flow G — Previous-year reuse

1. `新生活の6畳 2027` Archiveを開く
2. 前年REALをSaveし、Private PLANへAdapt
3. 商品や手持ち家具を変更してPublic derivativeとして共有
4. 条件を満たす派生CoordinateをCurrent Challengeへ参加
5. DetailのParent / RootとCreator seasonal reuseを往復して確認

Handoffは**Preview only**です。既存Room HarmonyやNITORI内部Systemへ通信しません。

## 実装Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React 18 / TypeScript / Vite / React Router | 13 route screens、Creator / Seasonal UI、responsive UI、typed API client |
| Backend | Python 3.11+ / FastAPI / Pydantic / SQLAlchemy / Pillow | ranking、Save / PLAN、Creator、lineage、Seasonal eligibility / Entry、safe image normalization |
| Data | SQLite + generated JSON seed + ignored local uploads | anonymous Session ownership、36 Coordinates、60 Products、6 Challenges、8 Entries、User contributions |
| Test | pytest / Vitest / Testing Library / Playwright | 54 backend tests、18 frontend tests、8 functional browser flows、3 responsive checks |

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
└── stop-demo.cmd    owned processes only stop
```

## Dataと権利の境界

- 36件のCoordinate、60件のProduct、価格、画像はすべて架空の機能検証Dataです。
- Product IDは`DEMO-*`であり、NITORI SKUではありません。
- 画像はこのRepository用に生成したoriginal SVGです。Instagram、NITORI Coordinate投稿、商品画像を取得・転載していません。
- 価格は`デモ価格スナップショット`と明示し、未取得価格は0円にせず件数を表示します。
- 外部URLはNITORI公式検索ページへの参考Linkで、在庫・Cart・購入・価格APIではありません。
- REAL / PLAN、Official / Staff / User declaredは将来のData modelを示す架空例で、公式認定や実在投稿を意味しません。
- Goal 2でUserがUploadした画像は`.demo/uploads/`へrandom filenameのWebPとしてLocal保存され、Git対象外です。元filename、client path、EXIFは保存しません。
- `USER_DECLARED` REALはUser申告であり、NITORIまたはSystemによる本人・購入・実在性の確認済み情報ではありません。
- 6件のChallengeと8件のEntryも架空のSeasonal seedです。`Prototype Pick`はDemo上のcontrolled recognitionで、NITORI社員による公式選定、人気順位、品質保証ではありません。
- Challenge参加数とREAL / PLAN内訳はcurrent SQLiteから計算し、fake view / like / rank countを保存しません。

詳細は[`data/README.md`](data/README.md)と[`docs/sources/source-links.md`](docs/sources/source-links.md)を参照してください。

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

更新前に`.demo/*.db`を別場所へCopyすることを推奨します。これは小規模Local Prototype向けのdeterministic upgradeであり、Production migration frameworkではありません。完全Resetを自分で選ぶ場合だけ、停止後に対象の`.demo` DBを削除して再起動します。詳細は[`Goal 1 → Goal 2`](docs/operations/goal1-to-goal2-migration.md)と[`Goal 2 → Goal 3`](docs/operations/goal2-to-goal3-migration.md)です。

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

Visual QA captureはDemo起動中に`npm.cmd run qa:visual`を実行すると`.demo/visual-qa/`へ出力されます。

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
