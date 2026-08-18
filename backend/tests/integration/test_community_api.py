from __future__ import annotations

import base64
from io import BytesIO
import struct
import zlib

import pytest
from PIL import Image

from app.services import images as image_service


OWNER = {"X-Session-ID": "creator-owner"}
OTHER = {"X-Session-ID": "community-reader"}


def image_bytes(format_name: str, *, exif: bool = False) -> bytes:
    output = BytesIO()
    image = Image.new("RGB", (12, 8), (74, 102, 84))
    metadata = None
    if exif:
        metadata = Image.Exif()
        metadata[0x010E] = "private demo description"
    save_options = {"exif": metadata} if metadata is not None else {}
    image.save(output, format=format_name, **save_options)
    return output.getvalue()


def png_dimensions_only(width: int, height: int) -> bytes:
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IEND", b"")


def create_identity(client, headers=OWNER, name="暮らしの試作家"):
    response = client.put(
        "/api/creators/me",
        json={"display_name": name, "bio": "6畳の暮らしを試作しています。"},
        headers=headers,
    )
    assert response.status_code == 200
    return response.json()


def upload_image(client, headers=OWNER, format_name="PNG", filename="room.png", exif=False):
    media_type = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}[format_name]
    response = client.post(
        "/api/community/images",
        files={"image": (filename, image_bytes(format_name, exif=exif), media_type)},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def coordinate_payload(kind="PLAN", image_ids=None, parent=None, derivation=None):
    return {
        "kind": kind,
        "title": "小さな部屋の落ち着く暮らし",
        "description": "手持ちの机を活かしたUser申告のコーデです。",
        "room_type": "ONE_ROOM",
        "size_band": "SMALL_6",
        "housing_type": "RENTAL",
        "household": "SINGLE",
        "budget_max": 50000,
        "style": "NATURAL",
        "needs": ["STORAGE", "WORK_FROM_HOME"],
        "products": [{"product_id": "DEMO-BED-01", "role": "MAIN_FURNITURE", "quantity": 1}],
        "existing_furniture": [
            {"label": "今持っている机", "category": "SUPPORT_FURNITURE", "dimensions": "幅90cm"}
        ],
        "image_ids": image_ids or [],
        "parent_coordinate_id": parent,
        "derivation_type": derivation,
    }


def publish_coordinate(client, payload, headers=OWNER):
    response = client.post("/api/community/coordinates", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_creator_identity_public_profile_and_session_privacy(client):
    creator = create_identity(client)
    mine = client.get("/api/creators/me", headers=OWNER)
    public = client.get(f"/api/creators/{creator['id']}", headers=OTHER)

    assert mine.status_code == 200
    assert mine.json()["is_owner"] is True
    assert public.status_code == 200
    assert public.json()["is_owner"] is False
    assert "owner_session_id" not in public.text
    assert "creator-owner" not in public.text


@pytest.mark.parametrize(
    ("format_name", "filename"),
    [("JPEG", "room.jpg"), ("PNG", "room.png"), ("WEBP", "room.webp")],
)
def test_safe_image_formats_are_normalized_to_webp(client, format_name, filename):
    uploaded = upload_image(client, format_name=format_name, filename=filename, exif=format_name == "JPEG")
    assert uploaded["mime_type"] == "image/webp"
    stored = client.app.state.settings.upload_dir / uploaded["url"].rsplit("/", 1)[-1]
    assert stored.parent == client.app.state.settings.upload_dir
    with Image.open(stored) as decoded:
        assert decoded.format == "WEBP"
        assert not decoded.getexif()


def test_upload_rejects_invalid_oversized_svg_and_traversal(client):
    invalid = client.post(
        "/api/community/images",
        files={"image": ("room.png", b"not an image", "image/png")},
        headers=OWNER,
    )
    assert invalid.status_code == 422

    corrupt_png = client.post(
        "/api/community/images",
        files={
            "image": (
                "corrupt.png",
                base64.b64decode(
                    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGNgYGD4z8DAwMDAxAADAA4AAf4CB2wAAAAASUVORK5CYII="
                ),
                "image/png",
            )
        },
        headers=OWNER,
    )
    assert corrupt_png.status_code == 422

    oversized = client.post(
        "/api/community/images",
        files={"image": ("room.png", b"0" * (8 * 1024 * 1024 + 1), "image/png")},
        headers=OWNER,
    )
    assert oversized.status_code == 413

    svg = client.post(
        "/api/community/images",
        files={"image": ("room.svg", b"<svg xmlns='http://www.w3.org/2000/svg'/>", "image/svg+xml")},
        headers=OWNER,
    )
    assert svg.status_code == 415

    traversal = client.post(
        "/api/community/images",
        files={"image": ("../room.png", image_bytes("PNG"), "image/png")},
        headers=OWNER,
    )
    assert traversal.status_code == 422


def test_upload_rejects_pixel_limit_before_full_decode(client, monkeypatch):
    monkeypatch.setattr(image_service, "MAX_IMAGE_PIXELS", 100)
    response = client.post(
        "/api/community/images",
        files={"image": ("large.png", png_dimensions_only(11, 10), "image/png")},
        headers=OWNER,
    )
    assert response.status_code == 413


def test_real_and_plan_creation_are_distinct_and_real_requires_image(client):
    create_identity(client)
    missing = client.post("/api/community/coordinates", json=coordinate_payload("REAL"), headers=OWNER)
    assert missing.status_code == 422

    uploaded = upload_image(client)
    real = publish_coordinate(client, coordinate_payload("REAL", [uploaded["id"]]))
    plan = publish_coordinate(client, coordinate_payload("PLAN"))

    assert real["kind"] == "REAL"
    assert real["provenance"] == "USER_DECLARED"
    assert real["verification_state"] == "USER_DECLARED_UNVERIFIED"
    assert real["status"] == "PUBLISHED"
    assert real["moderation_status"] == "ACTIVE"
    assert real["image_urls"][0].startswith("/uploads/")
    assert plan["kind"] == "PLAN"
    assert "購入済み" in plan["demo_disclosure"]

    stored = client.app.state.settings.upload_dir / real["image_urls"][0].rsplit("/", 1)[-1]
    assert stored.is_file()
    assert client.delete(f"/api/community/coordinates/{real['id']}", headers=OWNER).status_code == 204
    assert not stored.exists()


def test_helpful_save_adapt_publish_lineage_and_impact(client):
    original_creator = create_identity(client)
    uploaded = upload_image(client)
    original = publish_coordinate(client, coordinate_payload("REAL", [uploaded["id"]]))

    assert client.post(f"/api/community/coordinates/{original['id']}/helpful", headers=OWNER).status_code == 403
    first = client.post(f"/api/community/coordinates/{original['id']}/helpful", headers=OTHER)
    second = client.post(f"/api/community/coordinates/{original['id']}/helpful", headers=OTHER)
    assert first.json()["helpful_count"] == second.json()["helpful_count"] == 1
    assert client.post(f"/api/saved/{original['id']}", headers=OTHER).status_code == 200

    plan = client.post(f"/api/plans/from-coordinate/{original['id']}", json={}, headers=OTHER).json()
    assert plan["parent_coordinate_id"] == original["id"]
    assert plan["root_coordinate_id"] == original["id"]
    create_identity(client, OTHER, "自分向けアレンジャー")
    published = client.post(
        f"/api/plans/{plan['id']}/publish",
        json={"kind": "PLAN", "derivation_type": "LOWER_BUDGET", "remix_note": "予算を抑えました。"},
        headers=OTHER,
    )
    assert published.status_code == 201, published.text
    derivative = published.json()
    assert derivative["root_coordinate_id"] == original["id"]
    assert derivative["derivation_type"] == "LOWER_BUDGET"
    assert derivative["image_rights"] == "LOCALLY_CREATED_DEMO_PLACEHOLDER"
    assert derivative["image_url"] == "/assets/room-natural.svg"

    original_as_other = client.get(f"/api/coordinates/{original['id']}", headers=OTHER).json()
    assert original_as_other["helpful_count"] == 1
    assert original_as_other["genealogy"]["plan_started_count"] == 1
    assert original_as_other["genealogy"]["public_adaptation_count"] == 1

    profile = client.get(f"/api/creators/{original_creator['id']}", headers=OTHER).json()
    assert profile["impact"]["helpful_count"] == 1
    assert profile["impact"]["saved_count"] == 1
    assert profile["impact"]["plan_started_count"] == 1
    assert profile["impact"]["public_adaptation_count"] == 1

    # A private intermediate PLAN must not leak through another session's public response.
    public_derivative = client.get(f"/api/coordinates/{derivative['id']}", headers=OWNER).json()
    assert public_derivative["parent_coordinate_id"] is None
    assert public_derivative["genealogy"]["parent"]["id"] is None
    assert "community-reader" not in str(public_derivative)

    removed = client.delete(f"/api/community/coordinates/{original['id']}/helpful", headers=OTHER)
    assert removed.json() == {"coordinate_id": original["id"], "helpful": False, "helpful_count": 0}


def test_edit_unpublish_report_and_cycle_guards(client):
    creator = create_identity(client)
    root = publish_coordinate(client, coordinate_payload("PLAN"))
    child = publish_coordinate(
        client,
        coordinate_payload("PLAN", parent=root["id"], derivation="COLOR_VARIATION"),
    )
    profile = client.get(f"/api/creators/{creator['id']}", headers=OTHER).json()
    assert profile["impact"]["plan_started_count"] == 0
    assert profile["impact"]["public_adaptation_count"] == 1

    edited = client.patch(
        f"/api/community/coordinates/{root['id']}",
        json={"title": "編集後のタイトル"},
        headers=OWNER,
    )
    assert edited.status_code == 200
    assert edited.json()["title"] == "編集後のタイトル"
    assert client.patch(
        f"/api/community/coordinates/{root['id']}", json={"title": "侵入"}, headers=OTHER
    ).status_code == 404
    cycle = client.patch(
        f"/api/community/coordinates/{root['id']}",
        json={"parent_coordinate_id": child["id"], "derivation_type": "OTHER"},
        headers=OWNER,
    )
    assert cycle.status_code == 422

    report = client.post(
        f"/api/community/coordinates/{root['id']}/reports",
        json={"reason": "PRIVACY"},
        headers=OTHER,
    )
    assert report.status_code == 202
    assert report.json()["moderation_status"] == "ACTIVE"
    assert client.get(f"/api/coordinates/{root['id']}", headers=OTHER).status_code == 200
    assert client.post(
        f"/api/community/coordinates/{root['id']}/reports",
        json={"reason": "free text"},
        headers=OTHER,
    ).status_code == 422

    assert client.delete(f"/api/community/coordinates/{root['id']}", headers=OTHER).status_code == 404
    assert client.delete(f"/api/community/coordinates/{root['id']}", headers=OWNER).status_code == 204
    assert client.get(f"/api/coordinates/{root['id']}", headers=OTHER).status_code == 404
