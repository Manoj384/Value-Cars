import io
import pytest
from PIL import Image
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_image_upload_success(client: AsyncClient):
    # Create valid in-memory test image with PIL
    img_buf = io.BytesIO()
    img = Image.new("RGB", (800, 600), color=(73, 109, 137))
    img.save(img_buf, format="JPEG")
    img_buf.seek(0)

    files = [
        ("files", ("test_car_front.jpg", img_buf, "image/jpeg")),
    ]
    res = await client.post("/api/v1/uploads/images", files=files)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert "url" in data[0]
    assert "thumbnail_url" in data[0]
    assert data[0]["file_name"].endswith(".webp")


@pytest.mark.asyncio
async def test_image_upload_unsupported_type(client: AsyncClient):
    fake_txt = b"Hello world text file"
    files = [
        ("files", ("document.txt", io.BytesIO(fake_txt), "text/plain")),
    ]
    res = await client.post("/api/v1/uploads/images", files=files)
    assert res.status_code == 415
