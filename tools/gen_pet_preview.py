# -*- coding: utf-8 -*-
"""只生 3 張 key frame 驗證進化差異：newborn/growth/final 的 happy 版。"""
import sys
sys.path.insert(0, r"D:/CCdesk/Projects/classroom-pet/tools")
from gen_pet_all import STAGES, MOODS, STYLE, build_prompt, OUT_DIR, API_KEY, MODEL
from google import genai
from google.genai import types

client = genai.Client(api_key=API_KEY)
for stage in ["newborn", "growth", "final"]:
    name = f"{stage}_happy"
    out_path = OUT_DIR / f"{name}.png"
    print(f"gen: {name}")
    resp = client.models.generate_content(
        model=MODEL,
        contents=[build_prompt(stage, "happy")],
        config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )
    for part in resp.candidates[0].content.parts:
        if getattr(part, "inline_data", None):
            out_path.write_bytes(part.inline_data.data)
            print(f"  saved ({len(part.inline_data.data)//1024} KB)")
            break
