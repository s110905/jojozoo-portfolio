"""把作品集原始圖轉成網站用的 WebP。

原始 PNG 留在各案例資料夾供 GitHub 上的 README 使用，這裡只產生
public/images/ 底下給網站引用的壓縮版本：

    NN-slug/result.png  ->  public/images/cases/NN-slug/result.webp
    images/hero_banner.png -> public/images/hero_banner.webp
                           -> public/images/og-cover.jpg（社群分享卡）

首頁與案例頁引用的是同一份檔案。可重複執行，輸出會直接覆蓋。

用法： python scripts/optimize_images.py
"""

import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "images"
CASE_DIR = re.compile(r"^\d\d-")

MAX_WIDTH = 1400
QUALITY = 80

HERO_SRC = "images/hero_banner.png"
HERO_OUT = "hero_banner.webp"
HERO_MAX_WIDTH = 1774  # 首圖被裁成直式且放大 1.16 倍，維持原寬才夠銳利
HERO_QUALITY = 82

# 社群分享卡：固定 1200x630，用 JPEG 以確保各平台都吃得下
OG_OUT = "og-cover.jpg"
OG_SIZE = (1200, 630)


def to_webp(src: Path, out: Path, max_width: int, quality: int) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > max_width:
            height = round(im.height * max_width / im.width)
            im = im.resize((max_width, height), Image.LANCZOS)
        im.save(out, "WEBP", quality=quality, method=6)
        size = f"{im.width}x{im.height}"

    before = src.stat().st_size / 1024
    after = out.stat().st_size / 1024
    rel = out.relative_to(OUT_DIR).as_posix()
    print(f"{src.relative_to(ROOT).as_posix():40s} {before:7.0f} KB -> {rel:34s} {after:6.0f} KB  ({size})")


def build_og_card(src: Path, out: Path) -> None:
    """裁出 1200x630 的分享卡。JPEG 而非 WebP，社群平台相容性較穩。"""
    out.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = im.convert("RGB")
        target = OG_SIZE[0] / OG_SIZE[1]
        if im.width / im.height > target:
            # 來源較寬：保留高度，從右緣裁掉多餘寬度（左側標題不能被切）
            im = im.crop((0, 0, round(im.height * target), im.height))
        else:
            # 來源較高：從頂端裁，截圖的頁首資訊比頁尾重要
            im = im.crop((0, 0, im.width, round(im.width / target)))
        im = im.resize(OG_SIZE, Image.LANCZOS)
        im.save(out, "JPEG", quality=86, optimize=True, progressive=True)

    rel = out.relative_to(OUT_DIR).as_posix()
    print(f"{src.relative_to(ROOT).as_posix():40s} {'':7s}    -> {rel:34s} {out.stat().st_size / 1024:6.0f} KB  (1200x630)")


def main() -> None:
    to_webp(ROOT / HERO_SRC, OUT_DIR / HERO_OUT, HERO_MAX_WIDTH, HERO_QUALITY)
    build_og_card(ROOT / HERO_SRC, OUT_DIR / OG_OUT)

    for case in sorted(p for p in ROOT.iterdir() if p.is_dir() and CASE_DIR.match(p.name)):
        out_dir = OUT_DIR / "cases" / case.name
        for png in sorted(case.glob("*.png")):
            to_webp(png, out_dir / f"{png.stem}.webp", MAX_WIDTH, QUALITY)
        # 案例頁自己的分享卡；沒有截圖的案例由網站主卡代打
        primary = case / "result.png"
        if primary.exists():
            build_og_card(primary, out_dir / "og.jpg")


if __name__ == "__main__":
    main()
