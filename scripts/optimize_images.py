"""把作品集原始圖轉成網站用的 WebP。

原始 PNG 留在各案例資料夾供 README 使用，這裡只產生 public/images/ 底下
給前端引用的壓縮版本。可重複執行，輸出會直接覆蓋。

用法： python scripts/optimize_images.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "images"

# (來源, 輸出檔名, 最大寬度, 品質)
TARGETS = [
    ("images/hero_banner.png", "hero_banner.webp", 1774, 82),
    ("01-summer-camp/result.png", "projects/summer-camp.webp", 1400, 80),
    ("06-erp-automation-spider/result.png", "projects/erp-spider.webp", 1400, 80),
    ("09-jojozoocart/result.png", "projects/jojozoocart.webp", 1400, 80),
    ("03-hotel-partner-system/result.png", "projects/hotel-partner.webp", 1400, 80),
]


# 社群分享卡：固定 1200x630，用 JPEG 以確保各平台都吃得下
OG_SRC = "images/hero_banner.png"
OG_OUT = "og-cover.jpg"
OG_SIZE = (1200, 630)


def build_og_card() -> None:
    src = ROOT / OG_SRC
    out = OUT_DIR / OG_OUT

    with Image.open(src) as im:
        im = im.convert("RGB")
        target = OG_SIZE[0] / OG_SIZE[1]
        if im.width / im.height > target:
            # 來源較寬：保留高度，從右緣裁掉多餘寬度（左側標題不能被切）
            width = round(im.height * target)
            im = im.crop((0, 0, width, im.height))
        else:
            height = round(im.width / target)
            im = im.crop((0, 0, im.width, height))
        im = im.resize(OG_SIZE, Image.LANCZOS)
        im.save(out, "JPEG", quality=86, optimize=True, progressive=True)

    print(f"{OG_SRC:38s} {'':8s}    -> {OG_OUT:30s} {out.stat().st_size / 1024:7.0f} KB  (1200x630)")


def optimize(src_rel: str, out_rel: str, max_width: int, quality: int) -> None:
    src = ROOT / src_rel
    out = OUT_DIR / out_rel
    out.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > max_width:
            height = round(im.height * max_width / im.width)
            im = im.resize((max_width, height), Image.LANCZOS)
        im.save(out, "WEBP", quality=quality, method=6)

    before = src.stat().st_size / 1024
    after = out.stat().st_size / 1024
    print(
        f"{src_rel:38s} {before:8.0f} KB -> {out_rel:30s} "
        f"{after:7.0f} KB  ({im.width}x{im.height}, -{100 - after / before * 100:.0f}%)"
    )


if __name__ == "__main__":
    for args in TARGETS:
        optimize(*args)
    build_og_card()
