from __future__ import annotations

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.models import CoordinateImage


ACCEPTED_TYPES = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
}
MAX_IMAGE_PIXELS = 25_000_000
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


async def normalize_upload(
    session: Session,
    upload: UploadFile,
    session_id: str,
    upload_dir: Path,
    max_bytes: int,
) -> CoordinateImage:
    filename = upload.filename or ""
    if not filename or Path(filename).name != filename or "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=422, detail="Unsafe image filename")
    expected_format = ACCEPTED_TYPES.get(upload.content_type or "")
    if not expected_format:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WebP images are accepted")

    payload = await upload.read(max_bytes + 1)
    if len(payload) > max_bytes:
        raise HTTPException(status_code=413, detail="Each image must be 8 MB or smaller")
    if not payload:
        raise HTTPException(status_code=422, detail="Image file is empty")

    try:
        with Image.open(BytesIO(payload)) as probe:
            detected_format = probe.format
            if detected_format != expected_format:
                raise HTTPException(status_code=422, detail="Image content does not match its media type")
            if probe.width * probe.height > MAX_IMAGE_PIXELS:
                raise HTTPException(status_code=413, detail="Image dimensions are too large")
            probe.verify()
        with Image.open(BytesIO(payload)) as decoded:
            decoded.load()
            normalized = ImageOps.exif_transpose(decoded).convert("RGB")
            width, height = normalized.size
            output = BytesIO()
            normalized.save(output, format="WEBP", quality=88, method=6)
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError) as exc:
        raise HTTPException(status_code=422, detail="The uploaded file is not a decodable image") from exc

    encoded = output.getvalue()
    storage_name = f"{uuid4().hex}.webp"
    upload_dir.mkdir(parents=True, exist_ok=True)
    target = (upload_dir / storage_name).resolve()
    try:
        target.relative_to(upload_dir.resolve())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Unsafe upload path") from exc
    target.write_bytes(encoded)

    image = CoordinateImage(
        id=f"image-{uuid4()}",
        owner_session_id=session_id,
        storage_name=storage_name,
        mime_type="image/webp",
        width=width,
        height=height,
        size_bytes=len(encoded),
    )
    session.add(image)
    session.commit()
    return image


def image_url(image: CoordinateImage) -> str:
    return f"/uploads/{image.storage_name}"


def delete_coordinate_files(images: list[CoordinateImage], upload_dir: Path) -> None:
    base = upload_dir.resolve()
    for image in images:
        target = (base / image.storage_name).resolve()
        try:
            target.relative_to(base)
        except ValueError:
            continue
        if target.is_file():
            target.unlink()
