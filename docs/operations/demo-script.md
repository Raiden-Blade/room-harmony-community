# 5–8 Minute Demo Script

## Before the audience arrives

1. Browser zoomを100%にする。
2. `stop-demo.cmd` → `reset-demo.cmd` → confirmationへ`RESET` → `start-demo.cmd`の順で実行する。
3. <http://127.0.0.1:8000/health>が`status: ok`、Homeが表示されることを確認する。
4. Demo 2用に通常WindowとInPrivate / Incognito Windowを一つずつ用意する。SessionはBrowser localStorage単位で分離される。
5. Upload用には個人情報・人物・brand logoを含まないJPEG / PNG / WebPを用意する。

## Opening — 30 seconds

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| Home | 「好き」だけで終わらせず、自分の部屋で試せるPLANへ | 単品商品やSNS投稿を見るだけでなく、暮らしの条件から複数商品を検討し、実現した事例を次の人へ循環させるCoordinate Platform。Seasonalは補助的な再発見Layer | Homeが開かなければ`/health`確認。失敗時はRecovery手順へ |

## Demo 1 — Similar-to-me → PLAN — 2 minutes

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| `6畳のおすすめを見る` | `あなたの条件に近いコーデ` | AIではなく、広さ・困りごと・予算のdeterministic一致。PopularとのA/B結果ではない | 条件が違えば6畳 / 収納 / 5万円を選び`この条件で探す` |
| 先頭Cardの`空間全体を見る` | Coordinate Detail | 画像だけでなく、近い理由、5商品 / 5カテゴリ、概算を空間単位で見る | Cardが無ければHomeへ戻り同じ条件を再指定 |
| 1商品の`商品と使用コーデを見る` → 戻る | Product Detail → Coordinate | 商品から同じ商品を使うCoordinateへ逆探索できる | 新Tabを開いた場合は元Tabへ戻る |
| `あとで参考にする` → `このコーデを自分向けにアレンジ` | 保存済み → Private PLAN Edit | Saveは後で見るIntent、PLANは自分向けに変更するIntent | 既に保存済みでもPLAN作成は続行可能。混乱時はReset |
| `別の商品に変更`、手持ち家具名 / サイズ、`手持ち家具を追加` | 商品置換とExisting Furniture | 全部買い替えず、手持ち品は概算購入額へ含めない | 置換候補が見えなければ別roleの商品で試す |
| `この内容で比較準備へ` → `店舗で5商品を比較する` | PLAN Summary → Handoff Preview | 人が読むSummaryがMain。Room Harmonyへ送信せず、共有しない情報も明示 | `開発者向け：連携データを確認`で`live_integration: false`を示す |

## Demo 2 — Creator reuse — 1.5 minutes

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| 通常Windowの`つくる・投稿` | 3-step Create | 表示名はDemo identityでAuthenticationではない。REALは利用者申告・未検証 | Identityが残っていればそのまま次へ |
| `REAL ROOM` → 条件 → 商品 → local画像 → 公開 | Public Coordinate Detail | JPEG / PNG / WebPだけをdecodeし、EXIFを落としてrandom WebP名でlocal保存。購入証明ではない | Upload失敗時はPLANとして公開し、REAL uploadは説明だけに切替 |
| InPrivateで公開URLを開き、`参考になった`、`あとで参考にする`、`アレンジ` | 別SessionのHelpful / Save / Private PLAN | 自分の投稿へのHelpfulは禁止。役立ち、保存、Adaptは別Intent | 既に反応済みならInPrivateを閉じ、新しいInPrivate Sessionで開く |
| PLANをPublic derivativeとして共有 → 元Creator Profile | lineageとCreator Impact | Popularity競争でなく「事例が保存・PLAN・再利用されたか」を返す | 時間不足ならSeed Coordinateのlineageを見せる |

## Demo 3 — Previous year → Current Challenge — 1.5 minutes

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| Homeの`今のテーマと前年Archiveを見る` | Seasonal Landing | ChallengeはCore Productでも人気Contestでもなく、前年事例を今年の検討へ戻すGrowth Layer | `/seasonal`を直接開く |
| `新生活の6畳 2027` → 前年REAL | Archived Challenge / Coordinate | Archiveは消えたCampaign pageでなく、再利用可能なCoordinate集合 | 先頭の`空間全体を見る`を選ぶ |
| `このコーデを自分向けにアレンジ` → Public PLANとして共有 | Private PLAN → Public derivative | Parent / Root lineageを維持しながら今年向けに変更 | stale PLANがあれば保存・PLANから既存PLANを使用 |
| `新生活の6畳 2028`へ参加 | Current Challenge Entry | Serverがownership、公開状態、6畳・一人暮らし・賃貸・予算・商品数を再確認 | 条件外なら画面の理由を説明し、Seedの参加例へ切替 |
| Prototype Pick / Creator seasonal summary | controlled recognition | NITORI公式選定でも人気順位でもない。直接派生数は1世代だけ | Entry済みならgalleryとProfileの参加履歴を見せる |

## Demo 4 — Product reverse discovery — 45 seconds

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| `/products/DEMO-BED-01` | Demo Product Detail | `DEMO-*`は架空IDで、価格・在庫・NITORI SKUではない | URLを直接入力 |
| `この商品を使ったコーデを見る`のCard | Coordinate Detail | 単品から空間、別カテゴリ、PLANへ広げる | 最初の`空間全体を見る`を選ぶ |
| `このコーデを自分向けにアレンジ` | Private PLAN | Product reverse discoveryも同じPlanning Loopへ合流する | 作成済みPLANでもEdit画面が開けば成功 |

## Closing — 30 seconds

現在Claimできるのは、複数商品探索、PLAN、Store / EC action、Community / Seasonal reuseを操作・計測できることです。併売率・売上・購入率の向上はまだ証明していません。実商品ID mapping、正式API契約、認証、在庫・価格・POS、Room Harmony live integrationはHuman approval後の別段階です。

## Recovery matrix

| Symptom | Recovery |
|---|---|
| Upload fail | JPEG / PNG / WebP、8MB以下、25MP以下を確認。間に合わなければPLANへ切替 |
| Browser Sessionが想定と違う | 新しいInPrivate Windowを開く。raw Session IDは共有しない |
| Save / Helpfulが既に存在 | 別InPrivate Sessionを使うか、発表を止めてReset |
| Challengeが既にEntry済み | Gallery / Creator履歴で成功状態を説明。再現が必要ならReset |
| stale PLAN / 投稿が残る | `stop-demo.cmd` → `reset-demo.cmd` → `RESET` → `start-demo.cmd` |
| port 8000 / 5173 occupied | 表示されたPIDを確認。`stop-demo.cmd`はowned processだけを停止し、unmanaged processは人が判断して終了 |
| Browser refresh / route issue | Homeへ戻り同じPrimary pathを再開。PLAN / Saveは同じSessionに保持される |
| Backend unavailable | `/health`と`.demo/logs/*err.log`を確認。復旧しなければcapture済み画面でBoundaryを説明 |

物理的な別Windows PC、Projector / display、100% zoomは[`second-pc-checklist.md`](second-pc-checklist.md)で本番前に人が確認する。
