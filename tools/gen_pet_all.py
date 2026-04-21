# -*- coding: utf-8 -*-
"""批次生成 6 階段 × 4 心情 = 24 張電子寵物場景圖。
延用 young_* demo 的薄荷史萊姆 + 頭頂小芽設計。"""

import os
from pathlib import Path
from google import genai
from google.genai import types

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise SystemExit("ERROR: 請先 `set GEMINI_API_KEY=your-key`（PowerShell: `$env:GEMINI_API_KEY='your-key'`）")
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

# 每階段的外型描述（戲劇化進化，像寶可夢。保留統一元素：薄荷綠 + 頭頂植物 + 大眼 kawaii）
STAGES = {
    "egg": (
        "STAGE 1 form — ONLY an oval mint-green speckled egg with tiny green sprout "
        "at the top. NO creature visible at all, just the egg itself with no face. "
        "Size: small."
    ),
    "newborn": (
        "STAGE 2 form — a tiny round water-droplet shape baby creature hatching from "
        "a broken eggshell. Jelly-like round body, HUGE sparkly round baby eyes, "
        "tiny green sprout on head. Cracked eggshell pieces around its base. "
        "Very small, fits in a palm. No arms, no legs yet, just a blob."
    ),
    "young": (
        "STAGE 3 form — a small green slime-plant sprout spirit with a pair of tiny "
        "short arms and short legs standing upright. Still round chubby slime body, "
        "head has a small leaf sprout. Size of a teacup. Looks like a baby nature spirit."
    ),
    "growth": (
        "STAGE 4 form — a completely different animal shape now: a small mint-green "
        "FOX-like creature on four legs with pointy fox ears, a fluffy bushy tail, "
        "leafy collar around neck. Head has two small leaves instead of sprout. "
        "Size of a cat. Looks like a small forest spirit animal. Clearly NOT a slime anymore."
    ),
    "advanced": (
        "STAGE 5 form — a majestic flying beast: a mint-green fox-deer creature with "
        "large white feathered angel wings spread open, antlers with small leaves, "
        "long flowing tail ending in a flower bloom, floating slightly above ground. "
        "Size of a dog. Has a magical ethereal presence, hooves glowing faintly."
    ),
    "final": (
        "STAGE 6 form — LEGENDARY DIVINE BEAST: a glowing crystalline mint-green "
        "eastern dragon-fox hybrid with translucent body, crystal antlers, phoenix "
        "tail of glowing feathers, iridescent rainbow aura, golden halo floating "
        "behind head, small sparkles orbiting it, full flower bloom on forehead. "
        "Floating in mid-air. Imposing majestic size, dramatic pose. Like a "
        "legendary Pokemon final evolution."
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
            # 全部重生（差異太小那版要淘汰）
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
