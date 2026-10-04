#!/usr/bin/env python3
"""
Build dist/starlink-dish-card.js: the card from src/, with every dish photo from assets/dishes/ and
the D-DIN font from assets/fonts/ inlined, so the card is a single file that works from HACS or
/config/www.

Usage (from the repository root): python tools/build.py
"""
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src' / 'starlink-dish-card.js'
OUT = ROOT / 'dist' / 'starlink-dish-card.js'
DISHES = ROOT / 'assets' / 'dishes'
FONTS = ROOT / 'assets' / 'fonts'


def data_uri(path, mime):
    if not path.exists():
        raise SystemExit(f'Missing {path.relative_to(ROOT)}')
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def main():
    code = SRC.read_text()
    code, n = re.subn(r'__DISH_([a-z0-9_]+?)__', lambda m: data_uri(DISHES / f'{m.group(1)}.webp', 'image/webp'), code)
    geometry = DISHES / 'geometry.json'
    if not geometry.exists():
        raise SystemExit(f'Missing {geometry.relative_to(ROOT)} (run tools/make_dishes.py)')
    code = code.replace('__DISH_GEOMETRY__', json.dumps(json.loads(geometry.read_text()), separators=(',', ':')))
    code = code.replace('__DDIN_BOLD__', data_uri(FONTS / 'D-DIN-Bold.woff2', 'font/woff2'))
    code = code.replace('__DDIN__', data_uri(FONTS / 'D-DIN.woff2', 'font/woff2'))
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text('/* Built by tools/build.py from src/starlink-dish-card.js. Edit that file, not this one. */\n' + code)
    print(f'{OUT.relative_to(ROOT)}: {n} dishes, 2 fonts, {OUT.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
