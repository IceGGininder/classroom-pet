# -*- coding: utf-8 -*-
"""把 24 張 1MB+ PNG 壓縮到 ~200KB 以內：resize 512 + PNG optimize + palette quantize。"""
from pathlib import Path
from PIL import Image

SRC = Path(r"D:/CCdesk/Projects/classroom-pet/assets/pets")
DST = SRC  # overwrite

TARGET = 512

total_before, total_after = 0, 0
for png in sorted(SRC.glob("*.png")):
    before = png.stat().st_size
    total_before += before

    im = Image.open(png).convert("RGBA")
    if im.size != (TARGET, TARGET):
        im = im.resize((TARGET, TARGET), Image.LANCZOS)

    # quantize 256 色（保留 alpha）
    alpha = im.split()[-1]
    rgb = im.convert("RGB").quantize(colors=192, method=Image.MEDIANCUT)
    # 保留透明
    rgb = rgb.convert("RGBA")
    # 把 alpha 套回（此處原本沒透明的圖 alpha=255）
    rgb.putalpha(alpha)

    tmp = png.with_suffix(".tmp.png")
    rgb.save(tmp, "PNG", optimize=True)
    tmp.replace(png)
    after = png.stat().st_size
    total_after += after
    print(f"{png.name}: {before//1024} KB → {after//1024} KB")

print(f"\n total: {total_before//1024} KB → {total_after//1024} KB "
      f"({(1 - total_after/total_before)*100:.0f}% smaller)")
