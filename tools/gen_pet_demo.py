# -*- coding: utf-8 -*-
"""生成電子寵物史萊姆 demo：幼年階段 × 4 種心情（開心/平靜/擔心/害怕）。
用 Gemini 2.5 Flash Image (nano-banana) 產生 1:1 圖片。
確認風格後再生其他階段。"""

import os
from pathlib import Path
from google import genai
from google.genai import types

API_KEY = "GEMINI_API_KEY_REDACTED"
OUT_DIR = Path(r"D:/CCdesk/Projects/classroom-pet/assets/pets")
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL = "gemini-2.5-flash-image"

STYLE = (
    "Chibi slime creature, round translucent jelly body, mint green color, "
    "big round eyes, 2D cute illustration, thick black outline, flat colors, "
    "children's book style, kawaii, centered, 1:1 square composition, "
    "high contrast, cheerful palette."
)

STAGE = "young (small chick-like form with tiny fluff tuft on top, fits in hand)"

PROMPTS = {
    "young_happy": (
        f"{STYLE} A {STAGE} mint-green slime character with a bright smile, "
        "sparkling eyes, bouncing on a sunny green grass field. "
        "Background: bright blue sky with a few clouds, small flowers, "
        "butterflies. Overall mood: joyful, warm sunshine."
    ),
    "young_calm": (
        f"{STYLE} A {STAGE} mint-green slime character standing calmly on grass, "
        "neutral expression, eyes half-open, mild gentle smile. "
        "Background: soft green grass field, cloudy afternoon sky, calm peaceful mood."
    ),
    "young_worried": (
        f"{STYLE} A {STAGE} mint-green slime character peeking out from the entrance "
        "of a dark cave, only head and half body visible, worried expression, eyes "
        "slightly watery. Background: grey overcast sky, rocks around cave mouth, "
        "subdued colors, slight rain drizzle. Mood: cautious, nervous."
    ),
    "young_scared": (
        f"{STYLE} A {STAGE} mint-green slime hiding deep inside a dark cave, "
        "only two big round glowing eyes visible in the darkness, cowering in "
        "fear. Background: mostly black cave interior, faint blue rim light, "
        "dripping water, stalactites silhouettes. Mood: scared, hiding."
    ),
}

def main():
    client = genai.Client(api_key=API_KEY)

    for name, prompt in PROMPTS.items():
        out_path = OUT_DIR / f"{name}.png"
        print(f"[gen] {name} ...")
        resp = client.models.generate_content(
            model=MODEL,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )
        saved = False
        for part in resp.candidates[0].content.parts:
            if getattr(part, "inline_data", None):
                out_path.write_bytes(part.inline_data.data)
                print(f"   saved: {out_path}  ({len(part.inline_data.data)//1024} KB)")
                saved = True
                break
        if not saved:
            print(f"   FAILED: no image returned for {name}")

if __name__ == "__main__":
    main()
