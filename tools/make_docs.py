#!/usr/bin/env python3
"""
Make docs/dishes.png: every dish the card knows, side by side under Starlink's names.

Usage (from the repository root): python tools/make_docs.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DISHES = [
    ('standard', 'Standard 4 / 4X'), ('v5', 'Starlink V5'), ('mini', 'Mini / Mini X'),
    ('standard_actuated', 'Standard Actuated'), ('performance_gen_3', 'Performance (Gen 3)'),
    ('performance_gen_2', 'Performance (Gen 2)'), ('performance_gen_1', 'Performance (Gen 1)'),
    ('enterprise', 'Enterprise'), ('standard_circular', 'Standard Circular'),
]
COLS = 3


def font(size):
    for f in ['/System/Library/Fonts/Helvetica.ttc', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def main():
    tile_w, tile_h, label_h = 420, 225, 40
    rows = (len(DISHES) + COLS - 1) // COLS
    sheet = Image.new('RGB', (tile_w * COLS, (tile_h + label_h) * rows + 16), (0, 0, 0))
    draw = ImageDraw.Draw(sheet)
    f = font(17)
    for i, (key, name) in enumerate(DISHES):
        x, y = (i % COLS) * tile_w, (i // COLS) * (tile_h + label_h) + 16
        dish = Image.open(ROOT / 'assets' / 'dishes' / f'{key}.webp').convert('RGBA')
        dish = dish.resize((tile_w - 40, round((tile_w - 40) * dish.height / dish.width)), Image.LANCZOS)
        sheet.paste(dish, (x + 20, y + tile_h - dish.height), dish)
        tw = draw.textlength(name, font=f)
        draw.text((x + (tile_w - tw) / 2, y + tile_h + 8), name, fill=(200, 203, 208), font=f)
    sheet.save(ROOT / 'docs' / 'dishes.png', optimize=True)
    print('docs/dishes.png')


if __name__ == '__main__':
    main()
