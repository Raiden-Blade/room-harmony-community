# Room Harmony Integration Boundary

## Positioning

```text
Community  = Inspiration / Relevance / Save / PLAN / Adapt / Creator loop
Room Harmony = Product recommendation / Guided Chat / QR / Store route / Visit session
```

Both remain independent. Integration is a versioned handoff, not a shared database or code merge.

## Primary handoff

User action: `このPLANの商品を店舗で比較する`

Community creates an opaque handoff record in a future integration service, then opens Room Harmony with only a short-lived ID:

```text
room-harmony://visit/start?handoff_id=<opaque-id>&return_url=<approved-url>
```

Prototype may display the payload for review but must not call the Existing Room Harmony runtime.

Goal 4のCurrent UIは、最初に目的、商品件数、デモ概算、比較の起点、全商品名、共有しない情報をhuman-readable Summaryとして示す。Technical JSONはclosed `<details>`の中だけに置き、`schema_version`、Coordinate / Product IDs、anchor、intent、local return path、expiry、`live_integration: false`を確認できる。現在の`DEMO-*` Product IDをcanonical NITORI IDとして送らない。

Current preview accepts only a repository-local path such as `/plans/<id>` for `return_url`. The absolute approved-origin URL shown below is a future integration contract example and must not be enabled until an origin allowlist and owner review exist.

## Proposed handoff payload v1

```json
{
  "schema_version": "1.0",
  "handoff_id": "opaque-id",
  "source": "room-harmony-community",
  "coordinate_id": "coordinate-uuid",
  "coordinate_kind": "PLAN",
  "product_ids": ["official-product-id-1", "official-product-id-2"],
  "anchor_product_id": "official-product-id-1",
  "store_id": "optional-approved-store-id",
  "intent": "COMPARE_IN_STORE",
  "return_url": "https://approved-community.example/my-coordinate/...",
  "expires_at": "ISO-8601 timestamp"
}
```

Excluded:

- Name、email、phone、address
- Free-text room description
- Room photos
- Exact floorplan
- Purchase history
- Member ID in URL

## Room Harmony response / return

Future return event:

```json
{
  "handoff_id": "opaque-id",
  "status": "OPENED | ROUTE_VIEWED | COMPLETED | EXPIRED | FAILED",
  "visited_product_ids": ["..."],
  "occurred_at": "ISO-8601 timestamp"
}
```

Community does not receive raw chat text or route coordinates by default. Aggregate action state is enough for funnel analysis.

## Product ID compatibility

Integration is blocked until both systems agree on canonical Product ID. Existing Room Harmony currently uses IDs derived from its Product data and official `source_url`; Community must not assume all future official IDs match without a mapping contract.

Required mapping fields:

- `community_product_id`
- `official_product_id`
- `room_harmony_product_id`
- `valid_from / valid_to`
- `mapping_source`

## Session ownership

- Community session: discovery / save / PLAN context
- Room Harmony session: QR / store visit / recommendation / route
- Handoff ID: one-time bridge
- POS / order attribution: future approved analytics join

Community must not mint a Room Harmony visit session. Room Harmony validates QR / store context according to its own policy.

## Failure behavior

| Failure | Community behavior | Room Harmony behavior |
|---|---|---|
| No official integration | Show `接続準備中` / payload preview | No call |
| Handoff expired | Preserve PLAN, offer regenerate | Reject with explicit status |
| Product unmapped | List unavailable items, allow remaining | Never route unknown item |
| Store not selected | Ask in official flow or omit | Own store selection |
| Room Harmony unavailable | Offer EC / adviser / official product page | Recover independently |
| User returns | Restore same PLAN | Return only approved status |

## UX continuity

- CTA is goal-oriented: “Room Harmonyを開く”より“店舗で3商品を比較する”。
- Handoff screen shows selected product count and what data is shared.
- Visual style and return link are aligned where official integration allows.
- Browser back / deep-link failure has a clear fallback.

## Ownership matrix

| Concern | Community | Room Harmony | NITORI official system |
|---|---|---|---|
| Coordinate / PLAN | Owner | Read handoff summary | Optional source / consumer |
| Similar-to-me | Owner | No | No |
| Related product recommendation | No | Owner | Future input source |
| Guided Chat | No | Owner | Future adapter owner TBD |
| Store route | No | Owner | Store map truth / approval |
| Price / inventory | Snapshot only | Current sample only | Truth owner |
| Purchase | Event intent only | Visit event only | POS / Order truth |

## Current decision

**DECISION**: Current Goal 4もPreview boundaryだけを維持する。No API call, dependency, branch, or file change is made to Existing Room Harmony.
