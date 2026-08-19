from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "data" / "seed" / "demo_seed.json"
VISUAL_MANIFEST = ROOT / "data" / "seed" / "visual_asset_manifest.json"
PRODUCT_MANIFEST = ROOT / "data" / "seed" / "product_asset_manifest.json"

CATEGORIES = [
    ("BED", "MAIN_FURNITURE", "ベッド", 15_900),
    ("DESK", "SUPPORT_FURNITURE", "デスク", 8_900),
    ("STORAGE", "STORAGE", "収納", 5_900),
    ("LIGHTING", "LIGHTING", "照明", 2_900),
    ("TEXTILE", "TEXTILE", "テキスタイル", 3_900),
    ("SUPPORT", "SUPPORT_FURNITURE", "サイド家具", 4_900),
]

STYLES = [
    ("NATURAL", "ナチュラル", "明るい木目と生成りで、初めてでもまとめやすい部屋"),
    ("CLEAR_COOL", "クリアクール", "白とグレーを基調に、狭さを感じにくくした部屋"),
    ("DANDY", "ダンディ", "濃い木目と低い家具で落ち着きを出した部屋"),
    ("ELEGANT", "エレガント", "やわらかな色と照明で上品に整えた部屋"),
    ("COZY", "コージー", "布ものと間接照明でくつろぎを重視した部屋"),
    ("COLORFUL", "カラフル", "小物の色を絞り、生活感を楽しく見せる部屋"),
]

NEEDS = [
    ("STORAGE", "収納を増やしたい", "壁面とベッド周りを使って床を広く保ちます。"),
    ("LOW_BUDGET", "5万円以内で揃えたい", "優先順位を決め、最初に必要な商品へ予算を寄せます。"),
    ("WORK_FROM_HOME", "勉強・在宅作業をしたい", "作業面と照明を確保し、睡眠空間と緩やかに分けます。"),
    ("RELAX", "帰宅後にくつろぎたい", "低い家具と布ものを使い、視線の抜けを残します。"),
    ("SLEEP", "睡眠環境を整えたい", "ベッド周辺の光と収納を整理し、休みやすさを優先します。"),
    ("COMPACT", "6畳を広く使いたい", "奥行きの浅い家具と兼用できる商品を中心にします。"),
]

# The curated official Product subset has source-backed style hints only for
# these three styles. The other Coordinate styles remain useful prototype
# attributes, but must never inherit a verified Product match by index wrap.
VERIFIED_OFFICIAL_PRODUCT_STYLES = frozenset({"NATURAL", "CLEAR_COOL", "DANDY"})

# A Coordinate is a need-led composition, not the same five categories with a
# different title. Repeated categories intentionally select different products.
NEED_PRODUCT_TEMPLATES: dict[str, tuple[str, ...]] = {
    "STORAGE": ("BED", "STORAGE", "STORAGE", "LIGHTING", "TEXTILE"),
    "LOW_BUDGET": ("BED", "STORAGE", "LIGHTING"),
    "WORK_FROM_HOME": ("BED", "DESK", "SUPPORT", "LIGHTING", "STORAGE"),
    "RELAX": ("BED", "SUPPORT", "SUPPORT", "LIGHTING", "TEXTILE"),
    "SLEEP": ("BED", "TEXTILE", "LIGHTING", "STORAGE"),
    "COMPACT": ("BED", "DESK", "STORAGE", "SUPPORT"),
}

PROVENANCE = [
    ("DEMO", "Community demo team", "DEMO_TEAM"),
    ("STAFF", "スタッフ想定デモ", "STAFF_DEMO"),
    ("OFFICIAL", "公式想定デモ", "OFFICIAL_DEMO"),
]


def _select_product(
    priced_rows: list[dict[str, object]],
    coordinate_style: str,
    need_index: int,
    occurrence: int,
) -> tuple[dict[str, object], str]:
    official_rows = [
        row for row in priced_rows if row["provenance"] == "NITORI_OFFICIAL_SNAPSHOT"
    ]
    if official_rows:
        verified_rows = [
            row
            for row in official_rows
            if coordinate_style in VERIFIED_OFFICIAL_PRODUCT_STYLES
            and row.get("style_hint") == coordinate_style
        ]
        if occurrence == 0 and verified_rows:
            return verified_rows[0], "VERIFIED_MATCH"

        # Repeated categories and unsupported Coordinate styles use a neutral,
        # deterministic candidate pool. Selection is need-led, not a hidden
        # ELEGANT→NATURAL / COZY→CLEAR_COOL / COLORFUL→DANDY style mapping.
        neutral_rows = [row for row in official_rows if row not in verified_rows] or official_rows
        neutral_index = (need_index + max(occurrence - 1, 0)) % len(neutral_rows)
        return neutral_rows[neutral_index], "UNVERIFIED_NEUTRAL"

    product = priced_rows[(need_index + occurrence) % len(priced_rows)]
    return product, "DEMO_ONLY"


def build_products() -> list[dict[str, object]]:
    manifest = json.loads(PRODUCT_MANIFEST.read_text(encoding="utf-8"))
    observed_at = manifest["observed_at"]
    products: list[dict[str, object]] = [
        {
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "default_role": row["default_role"],
            "price_snapshot": row["price_snapshot"],
            "price_status": "NITORI_OFFICIAL_SNAPSHOT",
            "price_observed_at": observed_at,
            "official_url": row["official_url"],
            "image_url": row["local_asset"],
            "provenance": "NITORI_OFFICIAL_SNAPSHOT",
            "rights_status": "EXPLICITLY_PERMITTED",
            "style_hint": row["style_hint"],
        }
        for row in manifest["products"]
    ]
    for category, role, label, base_price in CATEGORIES:
        for index in range(7):
            style_code, style_label, _ = STYLES[(index + 3) % len(STYLES)]
            name = f"{style_label}{label} デモ{index + 1:02d}"
            missing = index == 6
            products.append(
                {
                    "id": f"DEMO-{category}-{index + 1:02d}",
                    "name": name,
                    "category": category,
                    "default_role": role,
                    "price_snapshot": None if missing else base_price + index * 700,
                    "price_status": "MISSING" if missing else "DEMO_SNAPSHOT",
                    "price_observed_at": None if missing else observed_at,
                    "official_url": f"https://www.nitori-net.jp/ec/search/?q={quote(label)}",
                    "image_url": f"/assets/product-{category.lower()}.svg",
                    "provenance": "DEMO",
                    "rights_status": "LOCALLY_CREATED_DEMO",
                    "style_hint": style_code,
                }
            )
    return products


def build_coordinates(products: list[dict[str, object]]) -> list[dict[str, object]]:
    visual_manifest = json.loads(VISUAL_MANIFEST.read_text(encoding="utf-8"))
    visual_entries = {item["coordinate_id"]: item for item in visual_manifest["coordinates"]}
    by_category: dict[str, list[dict[str, object]]] = {}
    for product in products:
        by_category.setdefault(str(product["category"]), []).append(product)

    coordinates: list[dict[str, object]] = []
    size_cycle = ["SMALL_6", "TINY_5_5", "SMALL_6", "MEDIUM_7_8"]
    size_labels = {"SMALL_6": "6畳", "TINY_5_5": "5.5畳", "MEDIUM_7_8": "7〜8畳"}
    for need_index, (need_code, need_label, need_copy) in enumerate(NEEDS):
        for style_index, (style_code, style_label, style_copy) in enumerate(STYLES):
            coordinate_index = need_index * len(STYLES) + style_index
            category_occurrences: dict[str, int] = {}
            product_rows: list[dict[str, object]] = []
            product_style_compatibility: list[str] = []
            for category in NEED_PRODUCT_TEMPLATES[need_code]:
                occurrence = category_occurrences.get(category, 0)
                category_occurrences[category] = occurrence + 1
                priced_rows = [row for row in by_category[category] if row["price_snapshot"] is not None]
                product, compatibility = _select_product(
                    priced_rows,
                    coordinate_style=style_code,
                    need_index=need_index,
                    occurrence=occurrence,
                )
                product_rows.append(product)
                product_style_compatibility.append(compatibility)
            product_items = [
                {
                    "product_id": product["id"],
                    "role": product["default_role"],
                    "source": "CATALOG_TO_BUY",
                    "quantity": 1,
                    "position": position,
                    "style_compatibility": product_style_compatibility[position],
                }
                for position, product in enumerate(product_rows)
            ]
            known_total = sum(int(product["price_snapshot"] or 0) for product in product_rows)
            budget_max = 50_000 if need_code == "LOW_BUDGET" or coordinate_index == 0 else _budget_ceiling(known_total)
            provenance, creator_display, creator_type = PROVENANCE[coordinate_index % len(PROVENANCE)]
            # Built-in records are reference/prototype compositions. REAL is
            # reserved for a user's own uploaded room, declared by that user.
            kind = "PLAN"
            needs = [need_code, "RENTAL"]
            if need_code != "COMPACT" and coordinate_index % 3 == 0:
                needs.append("COMPACT")
            existing = []
            if coordinate_index % 5 == 0:
                existing = [{"label": "手持ちのチェア", "category": "SUPPORT_FURNITURE", "dimensions": "幅45cm（デモ）"}]
            coordinate_id = f"coord-{coordinate_index + 1:03d}"
            size_band = size_cycle[coordinate_index % len(size_cycle)]
            size_label = size_labels[size_band]
            title = (
                f"{style_label}で整える、{size_label}を広く使うプラン"
                if need_code == "COMPACT"
                else f"{style_label}で整える、{need_label}{size_label}プラン"
            )
            visual_entry = visual_entries.get(coordinate_id)
            official_product_count = sum(
                product["provenance"] == "NITORI_OFFICIAL_SNAPSHOT" for product in product_rows
            )
            image_url = (
                visual_entry["current_asset"]
                if visual_entry
                else f"/assets/room-{style_code.lower().replace('_', '-')}.svg"
            )
            image_rights = visual_entry["rights_status"] if visual_entry else "LOCALLY_CREATED_DEMO"
            disclosure_parts = [
                (
                    "室内画像は、使用許可を前提にNITORI公式Coordinateページからローカル収録した参照素材です。"
                    if visual_entry
                    else "室内画像はリポジトリ内で制作したデモSVGです。"
                ),
                (
                    f"購入候補{official_product_count}件はNITORI公式商品ページの名称・商品コード・価格・主画像を2026年8月19日時点で対応付けた参照スナップショットです。"
                    if official_product_count
                    else "購入候補は架空の商品名・価格・画像によるデモです。"
                ),
                "コーデ構成・投稿者・在庫は実在や公式推奨を示しません。",
            ]
            demo_disclosure = "".join(disclosure_parts)
            coordinates.append(
                {
                    "id": coordinate_id,
                    "kind": kind,
                    "status": "READY_FOR_ACTION",
                    "visibility": "PUBLIC",
                    "title": title,
                    "description": f"{style_copy} {need_copy} コーデ構成は検証用です。室内画像と商品の出所は詳細画面に表示します。",
                    "room_type": "ONE_ROOM",
                    "size_band": size_band,
                    "housing_type": "RENTAL",
                    "household": "SINGLE",
                    "budget_band": _budget_band(budget_max),
                    "budget_max": budget_max,
                    "style": style_code,
                    "needs": needs,
                    "provenance": provenance,
                    "verification_state": "DEMO_ONLY",
                    "creator_display": creator_display,
                    "creator_type": creator_type,
                    "image_url": image_url,
                    "image_rights": image_rights,
                    "demo_disclosure": demo_disclosure,
                    "seasonal_collection": "NEW_LIFE_2027" if coordinate_index < 18 else None,
                    "editorial_rank": coordinate_index + 1,
                    "official_pick": coordinate_index in {0, 7, 14},
                    "seasonal_recognition": "NEW_LIFE_DEMO_PICK" if coordinate_index in {0, 7, 14} else None,
                    "items": product_items,
                    "existing_furniture": existing,
                }
            )
    return coordinates


def _budget_ceiling(total: int) -> int:
    for ceiling in (30_000, 50_000, 80_000, 120_000):
        if total <= ceiling:
            return ceiling
    return 120_000


def _budget_band(ceiling: int) -> str:
    return {30_000: "UNDER_30000", 50_000: "UNDER_50000", 80_000: "UNDER_80000", 120_000: "UNDER_120000"}[ceiling]


def main() -> None:
    products = build_products()
    payload = {
        "metadata": {
            "generated_at": "2026-08-19T00:00:00+09:00",
            "dataset_kind": "MIXED_OFFICIAL_SNAPSHOT_FUNCTIONAL_PROTOTYPE",
            "rights_notice": "Fifteen NITORI coordinate references, four hero references, and eighteen identity-matched NITORI product images are bundled locally under the user-confirmed prototype permission basis. Remaining room and product visuals are repository-created demo assets.",
            "price_notice": "NITORI-aligned product prices are dated snapshots; fallback product prices are fictional demo values. Neither represents current stock.",
        },
        "products": products,
        "coordinates": build_coordinates(products),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(payload['coordinates'])} coordinates and {len(products)} products to {OUTPUT}")


if __name__ == "__main__":
    main()
