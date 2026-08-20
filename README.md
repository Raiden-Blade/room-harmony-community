# Room Harmony Community

世界の暮らしを想起させる探索入口と「新生活 × 一人暮らし × 6畳」の現実条件をつなぎ、暮らしのCoordinateを**発見する → 商品と根拠を確認する → 保存 / 参考になった → Private PLANへAdapt → 配置とAI Assistを試す → Public PLAN / REAL ROOMとして再共有 → Creatorへ役立ちを返す**ところまで動かせるFunctional Prototypeです。

> 商品を一つずつ売るUIではなく、「なぜこの組み合わせが自分の暮らしに合うか」を理解し、手持ち家具も残しながら次の行動へ進めるかを検証します。

## Current status / Phase 2A

2026-08-20時点で、Goal 1のPlanning / Commerce、Goal 2のCreator / Community、Goal 3のSeasonal Growthを一つのLocal Functional Prototypeとして維持し、Goal 4で最終Demo向けの信頼性・画面品質・Reset・Error recoveryを強化しました。Goal 4Bでは主要15件のCoordinate画像、Goal 4C / 4DではHomeの4枚と主要導線で使う18商品の画像・名称・商品参照ID・価格を、使用許可確認済みのNITORI公式Sourceへ対応付けました。写真中心のExploreとProduct pickerは、相互に重複しない確認済みの参照写真だけを表示します。すべてローカルWebPで、出典追跡とfallbackを維持しています。これは、暮らしの事例を「見る」だけで終わらせず、自分向けPLANへ変え、店舗・ECで実現する準備をし、REAL ROOMとして次の人へ循環させるCoordinate Platformです。Seasonal ChallengeはCoreではなく、前年事例を再発見するGrowth Layerです。

本Prototypeは年間reuse loopとmulti-product explorationを操作・計測可能にしますが、Production効果、併売率・売上・購入率の向上、NITORIによる公式採用・選定、NITORI / Room Harmonyとの実接続は証明していません。

起動時の`/`は独立した`Room Around · Global discovery`入口です。12の国・地域ラベルと写真から探索のきっかけを選び、`Explore`、`Saved / MY PLAN`、`Create`へ遷移してから既存のRoom Harmony画面へ切り替わります。Global Home内へ商品一覧やAI編集を重ねていません。国名は探索用Prototype labelであり、写真の撮影地、投稿地、商品の原産地、各国を代表するStyleを意味しません。設計境界と評価Funnelは[`docs/product/global-discovery-bridge.md`](docs/product/global-discovery-bridge.md)を参照してください。

Phase 2AではPrivate PLAN編集内に`AI PLAN Assist`を追加しました。希望条件を保存し、5軸の適合度を決定論的に計算したうえで、AIはServerが許可した`KEEP / REPLACE / ADD / REMOVE`と18件の`NTR-*`候補から次の一手を最大3件選びます。価格・適合度・変更可否はBackendが再計算し、Userが`この提案をPLANに反映`を押すまでPLANは変わりません。これは汎用Chatbot、美的正解の判定、在庫・購入APIではありません。

PLAN編集の総覧では、元コーデの参考画像と現在選択中の商品画像を分けて表示し、希望との適合傾向、根拠付きの3点所見、折りたたみ式の判定根拠を確認してから`AIと一緒に配置イメージを試す`へ進みます。参考画像は選択商品の合成完成図ではありません。

統合入口`AIと一緒に配置イメージを試す`では、現在のPLAN商品を別商品へ変えずに2Dサンプルルームへ読み込み、drag、15°単位の回転、75〜125%の拡大縮小、配置から外す、undo、resetを試せます。配置はPrivate PLANへversion付きで保存・復元され、商品構成が変わった古い配置は自動適用しません。同じ画面の`商品 / AIアドバイス`を切り替え、明示的に`この配置をAIと一緒に見直す`を押した場合だけ生成した配置画像と現在のPLAN商品IDをBackendへ送ります。AIの位置変更案は最大2商品、Serverが移動量を制限し、画面でpreviewしてUserが保存するまで確定しません。実寸、動線、安全性、設置可否、美的正解は判定しません。

## いちばん簡単な起動方法（Windows）

1. このRepositoryをZIPでDownloadし、**ZIPを展開**します。
2. [Python 3.11以上](https://www.python.org/downloads/windows/)と[Node.js 20.19〜24.x](https://nodejs.org/)が未Installなら先にInstallします。GitはZIP利用では不要、`git clone`する場合はGit 2.xが必要です。Launcherは利用可能な`python.exe`を優先し、無ければWindows Python Launcherの`py.exe -3`を確認します。
3. Repository直下の`start-demo.cmd`をDouble-clickします。AIを使う場合は`1. OpenAI official`または`2. VectorEngine`を選び、hidden promptへ対応するAPI keyを入力します。最初の選択で空EnterならAIだけを無効にして起動します。VectorEngineは検証済みpreset `https://api.vectorengine.ai/v1` / `gpt-4o-mini`を使うため、URLやmodelの手入力は不要です。
4. 初回のみPython / Node依存関係が自動Installされ、Health check後にブラウザが開きます。

起動後:

- App: <http://127.0.0.1:5173>
- API health: <http://127.0.0.1:8000/health>
- Swagger / OpenAPI: <http://127.0.0.1:8000/docs>
- 終了: `stop-demo.cmd`をDouble-click
- 発表前の初期化: `reset-demo.cmd`をDouble-clickし、確認欄へ大文字で`RESET`と入力してから再度`start-demo.cmd`

LauncherはPython / virtualenv / Node version、依存関係、8000 / 5173 port、owned process、backend health、frontend応答を確認し、120秒でTimeoutします。失敗時は`.demo/logs/`の場所と原因を表示します。ZIP内から直接実行、Microsoft Store alias、Python / Node不足、古いvirtualenv、他Processによるport使用は自動で隠さず、修正方法を表示します。

API keyはBackend child processへだけ渡し、`.env`、command line、state file、logへ保存しません。LauncherはMachineに残る`OPENAI_API_KEY`を無視し、選択したBase URLとmodelもFrontendへ渡しません。非対話検証は`start-demo.cmd -DisableAI -NoBrowser`を使用します。Keyが無くても通常のPLAN編集と決定論的な適合度表示はすべて動きます。

VectorEngineはOpenAI公式Serviceではなく、第三者のOpenAI-compatible gatewayです。本Prototypeではsynthetic demo dataだけに使用し、NITORI内部情報、実在Customer情報、未公開Dataを送信しません。実Data利用には別途NITORI側のProvider審査・契約・Data handling承認が必要です。

既定portを使えない開発・検証環境だけは、Command Promptから`start-demo.cmd -NoBrowser -BackendPort 8303 -FrontendPort 5376`のように別portを指定できます。`stop-demo.cmd`は起動時の記録から同じportを確認し、`reset-demo.cmd -Force -BackendPort 8303 -FrontendPort 5376`はその検証用portだけを安全確認します。通常の利用者は指定不要です。

別Physical Windows PCでの確認はまだ自動検証と分けて扱います。Merge前の5分確認は[`docs/operations/second-pc-checklist.md`](docs/operations/second-pc-checklist.md)を使用してください。現在の状態は`MANUAL_SECOND_PC_TEST_REQUIRED`です。

## Primary Demo 4本

### Demo 1 — Similar-to-me → PLAN → 店舗比較Preview

Global Home → 国・地域の探索ラベル → `○○を深く見る` → Explore（既存条件一致）→ Coordinate → 商品 → 保存 → 自分用PLAN → 商品の置換 / 手持ち家具 → 2D配置 / AI Assist → 概算 → 店舗比較 → Handoff Preview。

### Demo 2 — Creator / Community reuse

画像付きREAL ROOMを公開 → 別Sessionで`参考になった` / 保存 → 自分向けにアレンジ → Public derivative → 元Creatorの役立ち指標を確認。

### Demo 3 — 前年Archive → Current Challenge

Seasonal → `新生活の6畳 2027` Archive → 前年の参考コーデ → Private PLAN → Public derivative → `新生活の6畳 2028`へ参加。Challengeは人気Contestではなく、条件付きの再利用導線です。

### Demo 4 — Product reverse discovery

Product Detail → `この商品を使ったコーデを見る` → Coordinate → Private PLAN。

5〜8分のClick順、説明、Failure時のFallbackは[`docs/operations/demo-script.md`](docs/operations/demo-script.md)を使用してください。Handoffは**接続前Preview only**で、既存Room HarmonyやNITORI内部Systemへ通信しません。

## 実装Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React 18 / TypeScript / Vite / React Router | 13 route screens、Creator / Seasonal UI、responsive UI、typed API client |
| Backend | Python 3.11+ / FastAPI / Pydantic / SQLAlchemy / Pillow | ranking、Save / PLAN、Creator、lineage、Seasonal eligibility / Entry、safe image normalization |
| AI provider | OpenAI Python SDK / Responses API / Structured Outputs / optional image input | 許可済み候補から構造化された1操作を選択し、明示送信された2D配置画像へ限定的な視覚所見を返す。価格・score・DB mutationは担当しない |
| Data | SQLite + generated JSON seed + ignored local uploads | anonymous Session ownership、36 Coordinates、60 Products、6 Challenges、8 Entries、User contributions |
| Test | pytest / Vitest / Testing Library / Playwright | Backend / Frontend / provider fake / functional browser / responsive checks |

Backendはruntime OpenAPIを`/openapi.json`で公開し、Frontendは[`frontend/src/api/types.ts`](frontend/src/api/types.ts)のTypeScript contractと[`frontend/src/api/client.ts`](frontend/src/api/client.ts)を通してだけ接続します。

## Repository structure

```text
room-harmony-community/
├── frontend/        React UI、typed API client、Vitest、Playwright
├── backend/         FastAPI、domain / service / repository、pytest
├── data/seed/       generated mixed official-snapshot / demo dataset
├── docs/            Phase 0定義 + implementation / runbook / decisions
├── scripts/         seed / validation / launcher helpers
├── start-demo.cmd   Windows one-click start
├── stop-demo.cmd    owned processes only stop
└── reset-demo.cmd   confirmed local demo-data reset
```

## Dataと権利の境界

- Built-in 36件はすべて参考 / 機能検証用PLANです。主要15件の公式室内画像は`REFERENCE ROOM`、残りは`PROTOTYPE PLAN`として表示し、User投稿のREAL ROOMとは区別します。
- 公式Sourceには各Roomの「使用しているアイテム」導線がありますが、本Prototypeの購入候補はそのRoom別商品IDとの一致を確認したものではありません。画像に写る商品を見た目から推定せず、室内画像と購入候補を別の参照情報として表示します。
- 60件のProductのうち18件は、NITORI公式商品ページの名称・商品参照ID・日付付き価格・主画像を商品単位で対応付けた`NTR-*`参照スナップショットです。残る42件は`DEMO-*`の架空商品です。
- Main Demoの15 Coordinateには、Userが本Prototypeでの使用許可を確認したNITORI公式「新生活用品」Coordinate参照画像をローカルWebPとして同梱しています。一般的なOpen licenseを意味せず、転載・再利用範囲を拡張するものではありません。
- Global Homeは、許可済みの異なる4室内画像をvisualに再利用します。12の国・地域名は探索ラベルで、画像の撮影地を示しません。Global Home自体は商品Cardを取得せず、Explore以降で既存Coordinate、商品、PLANへ接続します。
- 残りのCoordinateと42件のDemo ProductにはRepository-original SVGを使いますが、写真中心のExplore、Coordinateの商品欄、Createの商品選択には混在させません。個別SVGと共通fallbackは、直接参照と読み込み失敗時の安全策として保持します。Runtime hotlinkはありません。
- `NTR-*`価格は2026-08-19時点の公式参照スナップショット、`DEMO-*`価格は架空です。未取得価格は0円にせず件数を表示します。
- `NTR-*`は対応するNITORI公式商品ページ、`DEMO-*`は公式検索ページへの参考Linkです。どちらも在庫・Cart・購入・価格APIではありません。
- Built-in provenanceやCreator表示は検証用で、公式認定や実在投稿を意味しません。内蔵Seedは`DEMO` / `STAFF` / `OFFICIAL`の検証用区分だけを使い、`USER_DECLARED`は使いません。REAL ROOMは、Userが自分の部屋画像をUploadして`USER_DECLARED_UNVERIFIED`として公開した場合だけ使います。
- Coordinateの雰囲気は6種を保持しますが、18件のNITORI商品参照で確認済みの`style_hint`は`NATURAL` / `CLEAR_COOL` / `DANDY`だけです。`ELEGANT` / `COZY` / `COLORFUL`で使う公式商品候補はStyle一致を主張せず、Seedの`style_compatibility`を`UNVERIFIED_NEUTRAL`として明示します。
- Goal 2でUserがUploadした画像は`.demo/uploads/`へrandom filenameのWebPとしてLocal保存され、Git対象外です。元filename、client path、EXIFは保存しません。
- `USER_DECLARED` REALはUser申告であり、NITORIまたはSystemによる本人・購入・実在性の確認済み情報ではありません。
- 6件のChallengeと8件のEntryも架空のSeasonal seedです。`Prototype Pick`はDemo上のcontrolled recognitionで、NITORI社員による公式選定、人気順位、品質保証ではありません。
- Challenge参加数とREAL / PLAN内訳はcurrent SQLiteから計算し、fake view / like / rank countを保存しません。

画像・商品の対応は[`data/seed/visual_asset_manifest.json`](data/seed/visual_asset_manifest.json)、[`data/seed/hero_asset_manifest.json`](data/seed/hero_asset_manifest.json)、[`data/seed/product_asset_manifest.json`](data/seed/product_asset_manifest.json)、選定理由とfallbackは[`docs/operations/visual-asset-plan.md`](docs/operations/visual-asset-plan.md)、出典は[`docs/sources/source-links.md`](docs/sources/source-links.md)を参照してください。

## 推薦の意味

`あなたに近い`はAI / LLMではありません。Room size、Need、Budget、Room / Housing / Household、Style、手持ち家具との相性を固定weightで採点し、同点時もID順で決まるdeterministic rankingです。表示理由も同じ一致条件から生成します。`編集部ピック`はH1比較用のPopular / editorial baselineです。

PLAN編集の`AI PLAN Assist`はこの発見rankingとは別です。Preference profileと現在PLANを材料にAIが許可済みの操作候補を選び、Backendが同じ5軸を再採点します。任意の2D配置Demoでは、現在PLANとの商品ID連続性をBackendで検証してから限定的な画像所見を生成します。詳細なweight、provider boundary、key/privacy、stale fingerprintは[`docs/architecture/personalized-ai-plan-assist.md`](docs/architecture/personalized-ai-plan-assist.md)を参照してください。

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
- Generic chatbot、AI画像生成、3D / AR、実寸配置、美的正解の自動判定（2D配置画像への限定的な視覚所見だけをPrototypeに含む）
- 価格・在庫を継続更新するNITORI商品Master、POS、決済、店内Map
- Production authentication / deployment
- Live Room Harmony integration

Documentationの入口は[`docs/index.md`](docs/index.md)、実装構造は[`docs/architecture/implementation.md`](docs/architecture/implementation.md)、起動Troubleshootingは[`docs/operations/demo-runbook.md`](docs/operations/demo-runbook.md)です。
