# -*- coding: utf-8 -*-
"""批次生成 6 階段 × 4 心情 = 24 張電子寵物場景圖。
延用 young_* demo 的薄荷史萊姆 + 頭頂小芽設計。"""

import os
from pathlib import Path
from google import genai
from google.genai import types

API_KEY = "GEMINI_API_KEY_REDACTED"
OUT_DIR = Path(r"D:/CCdesk/Projects/classroom-pet/assets/pets")
OUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL = "gemini-2.5-flash-image"

# 共通風格 — 跨階段一致
STYLE = (
    "Chibi slime creature style, mint green translucent jelly body color, "
    "big expressive round eyes, 2D cute illustration, thick black outlines, "
    "flat colors, children's book kawaii style, centered, 1:1 square, "
    "consistent character identity with a tiny green sprout on top of the head. "
    "NO human hands, NO other animals, NO text."
)

# 每階段的外型描述（貫穿同一角色的進化）
STAGES = {
    "egg": (
        "an oval cute mint-green speckled egg with a tiny green sprout at the top, "
        "no character visible yet, just the egg"
    ),
    "newborn": (
        "a very small newborn mint-green slime just hatched from its eggshell, "
        "tiny body, cracked eggshell pieces around its base, oversized round eyes, "
        "tiny sprout on head"
    ),
    "young": (
        "a small young mint-green slime with a small sprout on its head, "
        "chubby round body, playful posture"
    ),
    "growth": (
        "a medium-sized mint-green slime with the sprout now sprouting two small leaves, "
        "rounder and more confident body, slight chubby cheeks, stronger outline"
    ),
    "advanced": (
        "a large mint-green slime that has evolved, the sprout has grown into a small "
        "flower bud on top, small decorative crystal spikes emerging from its back, "
        "more majestic presence but still cute"
    ),
    "final": (
        "a fully evolved glowing mint-green crystalline slime, the flower on its head "
        "is in full bloom, soft golden halo of light around it, tiny sparkles floating, "
        "translucent body with inner glow, majestic but still kawaii"
    ),
}

# 各心情的場景 + 表情
MOODS = {
    "happy": (
        "with a bright big smile, sparkling eyes, happy bouncing posture, "
        "on a sunny bright green grass field with small flowers and butterflies, "
        "clear blue sky with few white clouds, warm sunshine"
    ),
    "calm": (
        "with neutral gentle expression and mild smile, standing calmly, "
        "on a soft green grass field, cloudy afternoon sky, peaceful mood, "
        "muted pastel palette"
    ),
    "worried": (
        "with worried expression, eyebrows tilted, eyes slightly watery, peeking out "
        "from the entrance of a dark cave, only head and upper body visible, "
        "grey overcast sky, rocks around cave mouth, subdued colors, light drizzle"
    ),
    "scared": (
        "mostly hidden deep inside a dark cave, only two big round glowing eyes "
        "barely visible in the darkness, cowering in fear, mostly black cave "
        "interior with faint blue rim light, dripping water, stalactite silhouettes"
    ),
}

def build_prompt(stage_key: str, mood_key: str) -> str:
    stage_desc = STAGES[stage_key]
    mood_desc = MOODS[mood_key]
    return f"{STYLE} Character: {stage_desc}, {mood_desc}."

def main():
    client = genai.Client(api_key=API_KEY)
    total = len(STAGES) * len(MOODS)
    count = 0
    for stage_key in STAGES:
        for mood_key in MOODS:
            name = f"{stage_key}_{mood_key}"
            out_path = OUT_DIR / f"{name}.png"
            count += 1
            if out_path.exists() and stage_key == "young":
                print(f"[{count}/{total}] skip (exists): {name}")
                continue
            print(f"[{count}/{total}] gen: {name} ...", end=" ", flush=True)
            prompt = build_prompt(stage_key, mood_key)
            try:
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
                        print(f"saved ({len(part.inline_data.data)//1024} KB)")
                        saved = True
                        break
                if not saved:
                    print("FAILED (no image)")
            except Exception as e:
                print(f"ERROR: {e}")

    print("\nAll done. Check:", OUT_DIR)

if __name__ == "__main__":
    main()
