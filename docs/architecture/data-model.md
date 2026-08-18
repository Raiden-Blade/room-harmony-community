# Logical Data Model

## ER diagram

```mermaid
erDiagram
  USER ||--o{ COORDINATE : owns
  COORDINATE ||--o{ COORDINATE_IMAGE : has
  COORDINATE ||--|{ COORDINATE_ITEM : contains
  PRODUCT_REF o|--o{ COORDINATE_ITEM : referenced_by
  COORDINATE ||--|| ROOM_CONTEXT : describes
  COORDINATE }o--o{ PROBLEM_NEED : addresses
  COORDINATE ||--o| COORDINATE_DERIVATION : child_edge
  COORDINATE ||--o{ COORDINATE_DERIVATION : parent_of
  USER ||--o{ COORDINATE_SAVE : saves
  COORDINATE ||--o{ COORDINATE_SAVE : saved_as
  USER ||--o{ EVENT : causes
  COORDINATE ||--o{ EVENT : context

  USER {
    uuid id PK
    enum role
    datetime created_at
  }
  COORDINATE {
    uuid id PK
    uuid owner_user_id FK
    enum kind
    enum status
    enum visibility
    enum provenance
    enum verification_level
    string title
    text description
    int budget_min
    int budget_max
    datetime created_at
    datetime updated_at
  }
  ROOM_CONTEXT {
    uuid coordinate_id PK,FK
    enum room_type
    enum size_band
    enum housing_type
    enum household
  }
  COORDINATE_IMAGE {
    uuid id PK
    uuid coordinate_id FK
    string asset_ref
    enum provenance
    int sort_order
  }
  COORDINATE_ITEM {
    uuid id PK
    uuid coordinate_id FK
    string product_id FK
    enum role
    enum source
    int quantity
    int price_snapshot
    datetime price_observed_at
    string existing_label
  }
  PRODUCT_REF {
    string product_id PK
    string official_url
    string display_name_snapshot
    string image_url_snapshot
    datetime observed_at
  }
  PROBLEM_NEED {
    string code PK
    string label
  }
  COORDINATE_DERIVATION {
    uuid child_coordinate_id PK,FK
    uuid parent_coordinate_id FK
    enum remix_type
    json change_summary
    datetime created_at
  }
  COORDINATE_SAVE {
    uuid user_id PK,FK
    uuid coordinate_id PK,FK
    datetime created_at
  }
  EVENT {
    uuid id PK
    uuid anonymous_actor_id FK
    uuid coordinate_id FK
    string event_type
    json properties
    string experiment_id
    string variant
    datetime occurred_at
  }
```

## Modeling choices

### Coordinate need relation

Logical many-to-many is shown; implementation may use `coordinate_need` join table. Mermaid simplifies the join.

### Price

`price_snapshot` is evidence of what was displayed at a time, not master truth. Total calculation returns:

- `known_total`
- `unknown_item_count`
- `calculated_at`
- `currency`

Unknown price is not zero.

### Product role

Use a controlled but evolvable enum such as `MAIN_FURNITURE`, `SUPPORT_FURNITURE`, `STORAGE`, `LIGHTING`, `TEXTILE`, `DECOR`, `APPLIANCE`, `OTHER`. Do not encode visual style as product role.

### Change summary

Suggested shape:

```json
{
  "kept_item_ids": ["..."],
  "removed_item_ids": ["..."],
  "added_item_ids": ["..."],
  "reason_codes": ["LOWER_BUDGET", "KEEP_EXISTING_FURNITURE"],
  "parent_known_total": 70000,
  "child_known_total": 52000
}
```

This is a future contract example, not an implemented API.

## Similar-to-me query model

Input:

```text
room_type?, size_band?, housing_type?, household?, budget_band?, need_codes[], style_codes[]
```

Output per Coordinate:

```text
coordinate_id, score, matched_dimensions[], relaxed_dimensions[], evidence_quality
```

Ranking is deterministic in MVP. Exact weights are configuration and test evidence, not embedded domain truth.

## Index candidates for future implementation

- Coordinate `(visibility, status, kind, updated_at)`
- Room context `(room_type, size_band, housing_type, household)`
- Coordinate-Need `(need_code, coordinate_id)`
- Coordinate-Item `(product_id, coordinate_id)` for Product→Coordinate
- Derivation `(parent_coordinate_id, created_at)`
- Save `(user_id, created_at)`
- Event `(experiment_id, variant, occurred_at)` and `(coordinate_id, event_type)`

No production database is created in this Goal.

## Goal 2 local physical model

上のERは長期Logical modelである。Goal 2のLocal SQLite implementationはProduction `USER` / Authenticationを作らず、次を追加する。

- `creator_profiles`: internal id、private `owner_session_id`、public display name / bio。
- `coordinates.creator_id`: optional display identity link。
- `coordinates.parent_coordinate_id`: 直接参考にしたCoordinateまたはPrivate PLAN。
- `coordinates.root_coordinate_id`: 派生系列の起点。
- `coordinates.derivation_type`: controlled remix reason。
- `coordinates.moderation_status`: `ACTIVE / HIDDEN` prototype state。
- `coordinate_images`: random local storage referenceとdimensions。original filename / EXIFなし。
- `helpful_reactions`: `(session_id, coordinate_id)` unique current reaction。
- `content_reports`: `(session_id, coordinate_id)` unique report、controlled reason、no auto-delete。

Raw Session IDをPublic APIへ返さない。Hidden / unpublish parentがあってもchild FK recordは削除せず、閲覧者にprivate IDを露出しないtombstone表示を使う。
