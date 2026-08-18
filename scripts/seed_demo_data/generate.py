from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "data" / "seed" / "demo_seed.json"
VISUAL_MANIFEST = ROOT / "data" / "seed" / "visual_asset_manifest.json"

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
    ("LOW_BUDGET", "5万円前後で揃えたい", "優先順位を決め、最初に必要な商品へ予算を寄せます。"),
    ("WORK_FROM_HOME", "勉強・在宅作業をしたい", "作業面と照明を確保し、睡眠空間と緩やかに分けます。"),
    ("RELAX", "帰宅後にくつろぎたい", "低い家具と布ものを使い、視線の抜けを残します。"),
    ("SLEEP", "睡眠環境を整えたい", "ベッド周辺の光と収納を整理し、休みやすさを優先します。"),
    ("COMPACT", "6畳を広く使いたい", "奥行きの浅い家具と兼用できる商品を中心にします。"),
]

PROVENANCE = [
    ("DEMO", "Community demo team", "DEMO_TEAM"),
    ("STAFF", "スタッフ想定デモ", "STAFF_DEMO"),
    ("OFFICIAL", "公式想定デモ", "OFFICIAL_DEMO"),
    ("USER_DECLARED", "暮らし手想定デモ", "USER_DEMO"),
]


def build_products() -> list[dict[str, object]]:
    products: list[dict[str, object]] = []
    observed_at = "2026-08-18T00:00:00+00:00"
    for category, role, label, base_price in CATEGORIES:
        for index in range(10):
            style_code, style_label, _ = STYLES[index % len(STYLES)]
            name = f"{style_label}{label} デモ{index + 1:02d}"
            missing = index == 9
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
    visual_assets = {
        item["coordinate_id"]: item["current_asset"] for item in visual_manifest["coordinates"]
    }
    by_category: dict[str, list[dict[str, object]]] = {}
    for product in products:
        by_category.setdefault(str(product["category"]), []).append(product)

    coordinates: list[dict[str, object]] = []
    size_cycle = ["SMALL_6", "TINY_5_5", "SMALL_6", "MEDIUM_7_8"]
    size_labels = {"SMALL_6": "6畳", "TINY_5_5": "5.5畳", "MEDIUM_7_8": "7〜8畳"}
    for need_index, (need_code, need_label, need_copy) in enumerate(NEEDS):
        for style_index, (style_code, style_label, style_copy) in enumerate(STYLES):
            coordinate_index = need_index * len(STYLES) + style_index
            product_index = (need_index * 2 + style_index) % 9
            selected_categories = ["BED", "DESK", "STORAGE", "LIGHTING", "TEXTILE"]
            if need_code == "RELAX":
                selected_categories[1] = "SUPPORT"
            product_rows = [by_category[category][product_index] for category in selected_categories]
            product_items = [
                {
                    "product_id": product["id"],
                    "role": product["default_role"],
                    "source": "CATALOG_TO_BUY",
                    "quantity": 1,
                    "position": position,
                }
                for position, product in enumerate(product_rows)
            ]
            known_total = sum(int(product["price_snapshot"] or 0) for product in product_rows)
            budget_max = 50_000 if coordinate_index == 0 else _budget_ceiling(known_total)
            provenance, creator_display, creator_type = PROVENANCE[coordinate_index % len(PROVENANCE)]
            kind = "PLAN" if coordinate_index % 4 == 1 else "REAL"
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
            coordinates.append(
                {
                    "id": coordinate_id,
                    "kind": kind,
                    "status": "PUBLISHED" if kind == "REAL" else "READY_FOR_ACTION",
                    "visibility": "PUBLIC",
                    "title": title,
                    "description": f"{style_copy} {need_copy} 商品構成・価格・画像はすべてデモです。",
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
                    "image_url": visual_assets.get(
                        coordinate_id, f"/assets/room-{style_code.lower().replace('_', '-')}.svg"
                    ),
                    "image_rights": "LOCALLY_CREATED_DEMO",
                    "demo_disclosure": "オリジナルSVGと架空の商品構成によるデモです。実在の投稿・在庫・価格ではありません。",
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
            "generated_at": "2026-08-18T00:00:00+00:00",
            "dataset_kind": "SYNTHETIC_FUNCTIONAL_PROTOTYPE",
            "rights_notice": "No third-party coordinate image is included. All SVG assets are locally created demo visuals.",
            "price_notice": "All prices are fictional demo snapshots and may not match current official prices.",
        },
        "products": products,
        "coordinates": build_coordinates(products),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(payload['coordinates'])} coordinates and {len(products)} products to {OUTPUT}")


if __name__ == "__main__":
    main()
