# Room Harmony Community

NITORIの既存Coordinate資産を、閲覧だけでなく「自分に近い事例の発見 → PLAN → Store / EC Action → REAL ROOM → 次の人の発見」へ循環させる参加型Coordinate PlatformのProduct Definition repositoryです。

> 暮らしの事例を「見る」だけで終わらせず、自分の条件に合わせたPLANへ変え、店舗・ECで実現し、REAL ROOMとして次の人へ循環させる。

## Repository boundary

本Repositoryは既存[Room Harmony](https://github.com/Raiden-Blade/room-harmoney)から意図的に分離しています。既存Room Harmonyはread-only referenceであり、QR、商品Recommendation、Guided Chat、複数商品のStore Routeを担当します。本RepositoryはCoordinate discovery、Save、PLAN / REAL、Adapt / Remix、Creator / Seasonal loopを定義します。

## Current status

Product Definition、Current-state audit、Domain / Data / System Architecture、MVP、Phase 1 planまでを作成しました。Phase 1の本実装には進まず、人間Reviewを待つ状態です。

今回の範囲外:

- Full React / FastAPI application
- Production authentication / upload / social features
- ML / AI image recognition / LLM concierge
- NITORI internal API / POS / live Room Harmony integration
- Production deployment

最初に[Documentation Index](docs/index.md)を読み、Fact / Observation / Inference / Hypothesisの区別とSource statusを確認してください。
