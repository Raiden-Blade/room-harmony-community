# Problem Definition

## The problem is not content scarcity

**VERIFIED FACT**: NITORIには大量のStaff / User Coordinateと、Seasonal / Problem-based contentが既にある。

したがってProblemを「参考写真が足りない」と定義すると、既存資産を無視し、Instagram / Pinterestの劣化版を作る。

## User problem

家具・Interiorの購入者は、個別商品を評価できても、次の変換で負荷が高いという仮説を置く。

```text
きれいな事例を見た
  ↓
自分の6畳・賃貸・予算・既存家具でも成立するか分からない
  ↓
構成商品を一つずつ調べる
  ↓
店舗でどれを見るか決められない
  ↓
単品購入または離脱
```

これは **HYPOTHESIS** であり、User interviewとBehavior dataで検証する。

## Business problem

**INFERENCE**: NITORIが既に持つCoordinate、Product、Store、Adviserの価値が、利用者単位の継続するPlanとして束ねられていない場合、空間単位の商品認知が途中で失われる可能性がある。

Business因果仮説:

```text
条件の近いCoordinateを発見
→ 複数商品の役割を理解
→ My PLANへ追加
→ EC / 店舗で複数商品を確認
→ 同一空間商品のPurchase intent
→ 将来の併売率向上
```

最後の「Purchase / 併売率」はLagging outcomeで、現在の公開情報やPrototypeからは確認できない。

## Jobs to be done

| Situation | Job | Current friction hypothesis | Desired outcome |
|---|---|---|---|
| 新生活前 | 限られた部屋と予算で一式を考えたい | Popular事例は自分の条件と距離がある | 6畳・1K・予算内のPLAN |
| 商品を一つ気に入れた | その商品を使う空間全体を見たい | Related productだけでは暮らし像が弱い | Product→Coordinate→複数商品理解 |
| 既存家具を残したい | 買い足しで雰囲気・機能を変えたい | 全取替え型の事例は現実離れ | Existing + TO_BUYのPLAN |
| 店舗へ行く前 | 見る商品と相談内容を整理したい | 情報がPage間に分散 | Structured handoff |
| 購入後 | 工夫を他の人に役立てたい | SNS投稿とProduct / Room contextが分離 | Provenance付きREAL ROOM |

## Explicit non-problems

本Projectが解かないもの:

- EC商品検索・Cart・決済
- Official inventory / floor map maintenance
- Professional 3D interior design
- Room Harmonyの店内Route計算
- General-purpose social networking
- AIによる美的正解の自動判定

## Problem validation questions

1. Coordinate閲覧者はどの段階で「自分には合わない」と感じるか。
2. Room size、Budget、Housing、Existing furnitureのどれが選択を最も変えるか。
3. Product→Coordinateの事例が複数Category探索を増やすか。
4. SaveとMy PLANは同じ行動か、別の意図か。
5. 店舗Staffは事前PLANを受け取ると接客が速くなるか、確認作業が増えるか。
6. 購入後にREAL ROOMを共有する動機は何か。Recognition、役立ち、Rewardのどれか。

## Problem statement

> **HYPOTHESIS**: NITORIのCoordinate資産は豊富だが、利用者が「自分に近い事例」を選び、自分の条件と既存家具に合わせて実行可能なPLANへ変換し、EC / 店舗で複数商品を確認し、実現後のREALを次の利用者へ戻す一貫した状態が不足している。
