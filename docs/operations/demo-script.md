# 5–8 Minute Demo Script

## Before the audience arrives

1. Browser zoomを100%にする。
2. `stop-demo.cmd` → `reset-demo.cmd` → confirmationへ`RESET` → `start-demo.cmd`の順で実行する。AI提案も実演する場合だけServiceを選んでhidden promptへ一時Keyを入力し、通常は最初の選択で空EnterしてAIを無効化する。
3. <http://127.0.0.1:8000/health>が`status: ok`、Homeが表示されることを確認する。
4. Demo 2用に通常WindowとInPrivate / Incognito Windowを一つずつ用意する。SessionはBrowser localStorage単位で分離される。
5. Upload用には個人情報・人物・brand logoを含まないJPEG / PNG / WebPを用意する。

## Opening — 30 seconds

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| Home | 独立したRoom Around Global Home | 起動時は発見に集中し、商品一覧や条件Formを同一画面へ詰め込まない。国・地域名は撮影地ではなく探索ラベル。多様性や併売率の効果は未検証 | Homeが開かなければ`/health`確認。失敗時はRecovery手順へ |

## Demo 1 — Similar-to-me → PLAN — 2 minutes

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| 国・地域ラベル → `○○を深く見る` | App Headerを持つExplore | Global側は視覚的な探索入口。遷移後は国別実績ではなく、広さ・困りごと・予算のdeterministic一致へ切り替わる | `/explore?room_size=SMALL_6&need=STORAGE&budget_max=50000`を直接開く |
| 先頭Card（`coord-001`）の`空間全体を見る` | Coordinate Detail | 明るい木目と収納が見える許可済みREFERENCE ROOMを入口に、選択条件との実際の一致、5商品 / 4カテゴリ、概算を空間単位で見る。室内画像と購入候補は別の参照情報であることも説明 | Cardが無ければHomeへ戻り6畳 / 収納 / 5万円を再指定 |
| 1商品の`商品と使用コーデを見る` → 戻る | Product Detail → Coordinate | 商品から同じ商品を使うCoordinateへ逆探索できる | 新Tabを開いた場合は元Tabへ戻る |
| `あとで参考にする` → `このコーデを自分向けにアレンジ` | 保存済み → Private PLAN Edit | Saveは後で見るIntent、PLANは自分向けに変更するIntent | 既に保存済みでもPLAN作成は続行可能。混乱時はReset |
| `別の商品に変更`、手持ち家具名 / サイズ、`手持ち家具を追加` | 商品置換とExisting Furniture | 全部買い替えず、手持ち品は概算購入額へ含めない | 置換候補が見えなければ別roleの商品で試す |
| PLAN総覧 → `AIと一緒に配置イメージを試す` | 参考コーデ画像、現在の商品画像、5軸レーダー、3点所見 / 保存可能な2D配置 | 現在PLANの商品を動かして保存し、同じ画面の`商品 / AIアドバイス`から画像評価または商品候補の見直しへ進む。AI位置案はpreview後にUserが保存するまで確定しない | Keyなしでも配置保存とルール分析は利用でき、AI操作時は設定方法を案内する |
| `この条件でAI調整案をつくる` → 提案Card | 最大3件の構造化提案 | AIはServer許可済みの1操作とNTR候補を選ぶだけ。priceとbefore/after scoreはBackendが計算し、この時点ではPLAN未変更 | AI停止中ならdisabled状態と通常編集の継続を説明。失敗時は認証・利用枠・限流・モデル・接続の区別を示す |
| `この提案をPLANに反映` | 商品・価格・適合度が更新 | Human confirmation後だけ既存PLAN mutationを実行。stale PLANは拒否して提案を作り直す | Provider障害時は通常の商品置換へ戻る |
| `この内容で比較準備へ` → `店舗で5商品を比較する` | PLAN Summary → Handoff Preview | 人が読むSummaryがMain。Room Harmonyへ送信せず、共有しない情報も明示 | `開発者向け：連携データを確認`で`live_integration: false`を示す |

## Demo 2 — Creator reuse — 1.5 minutes

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| 通常Windowの`つくる・投稿` | 3-step Create | 表示名はDemo identityでAuthenticationではない。REALは利用者申告・未検証 | Identityが残っていればそのまま次へ |
| `REAL ROOM` → 条件 → 商品 → local画像 → 公開 | Public Coordinate Detail | JPEG / PNG / WebPだけをdecodeし、EXIFを落としてrandom WebP名でlocal保存。購入証明ではない | Upload失敗時はPLANとして公開し、REAL uploadは説明だけに切替 |
| InPrivateで公開URLを開き、`参考になった`、`あとで参考にする`、`アレンジ` | 別SessionのHelpful / Save / Private PLAN | 自分の投稿へのHelpfulは禁止。役立ち、保存、Adaptは別Intent | 既に反応済みならInPrivateを閉じ、新しいInPrivate Sessionで開く |
| PLANをPublic derivativeとして共有 → 元Creator Profile | lineageとCreator Impact | Popularity競争でなく「事例が保存・PLAN・再利用されたか」を返す | 時間不足なら`coord-031`のベッド・ソファ・収納の全景を見せ、手持ち家具を含むAdaptation説明へ切替 |

## Demo 3 — Previous year → Current Challenge — 1.5 minutes

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| `/seasonal`を開く | Seasonal Landing | ChallengeはCore Productでも人気Contestでもなく、前年事例を今年の検討へ戻すGrowth Layer | `/seasonal`を直接開く |
| `新生活の6畳 2027` → 前年の参考コーデ（`coord-001`等） | Archived Challenge / Coordinate | Archiveは消えたCampaign pageでなく、収納中心の前年REFERENCE ROOM / PROTOTYPE PLANを再利用できる集合。User申告REAL ROOMとは呼ばない | 先頭の`空間全体を見る`を選ぶ |
| `このコーデを自分向けにアレンジ` → Public PLANとして共有 | Private PLAN → Public derivative | Parent / Root lineageを維持しながら今年向けに変更 | stale PLANがあれば保存・PLANから既存PLANを使用 |
| `新生活の6畳 2028`へ参加 | Current Challenge Entry | Serverがownership、公開状態、6畳・一人暮らし・賃貸・予算・商品数を再確認 | 条件外なら画面の理由を説明し、Seedの参加例へ切替 |
| Prototype Pick / Creator seasonal summary | controlled recognition | NITORI公式選定でも人気順位でもない。直接派生数は1世代だけ | Entry済みならgalleryとProfileの参加履歴を見せる |

## Demo 4 — Product reverse discovery — 45 seconds

| Click target | Expected screen | What to explain | Fallback |
|---|---|---|---|
| `/products/NTR-2110600044491-0000002000852` | NITORI Product Reference Detail | 名称・参照ID・日付付き価格・主画像・公式商品URLが同じ商品へ対応する。現在価格・在庫ではない | URLを直接入力 |
| `この商品を使ったコーデを見る`の先頭Card（`coord-001`） | Coordinate Detail | 商品参照と公式室内参照画像を別の根拠として示し、単品から収納を含む空間、別カテゴリ、PLANへ広げる | 最初の`空間全体を見る`を選ぶ |
| `このコーデを自分向けにアレンジ` | Private PLAN | Product reverse discoveryも同じPlanning Loopへ合流する | 作成済みPLANでもEdit画面が開けば成功 |

## Closing — 30 seconds

現在Claimできるのは、18商品の日付付きIdentity snapshotを含む複数商品探索、PLAN、決定論的適合度、Human-confirmed AI editing assist、Store / EC action、Community / Seasonal reuseを操作・計測できることです。AIの提案品質や、併売率・売上・購入率の向上はまだ証明していません。全商品Master mapping、正式API契約、認証、在庫・価格・POS、Room Harmony live integrationはHuman approval後の別段階です。

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
| AI disabled / timeout / auth error | PLAN fitと通常編集は継続できる。Keyを画面やlogへ貼らず、必要なら停止後にhidden promptから再入力 |

物理的な別Windows PC、Projector / display、100% zoomは[`second-pc-checklist.md`](second-pc-checklist.md)で本番前に人が確認する。
