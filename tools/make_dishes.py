#!/usr/bin/env python3
"""
Make the dish images the card uses from Starlink's product photos.

Starlink's photos are already cut out (transparent background), so this:
  - keeps only the dish: some kit photos include the router beside it, which is dropped
  - puts each dish on the same canvas, as large as fits, standing on the same ground line, with a
    soft contact shadow under where it touches the ground

Input: assets/photos/<model>.(webp|png). Output: assets/dishes/<model>.webp, all the same size, and
assets/dishes/geometry.json: where each dish sits on the canvas (the card centres its snow-melt glow
on it).

Usage (from the repository root):
  pip install -r tools/requirements.txt
  python tools/make_dishes.py
  python tools/build.py
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / 'assets' / 'photos'
OUT = ROOT / 'assets' / 'dishes'

CANVAS = (1120, 600)     # width, height: the card's dish box is this shape
MARGIN = 0.02            # space kept clear round the edge of the canvas
GROUND = 0.965           # the ground line, as a fraction of the canvas height
QUALITY = 88


def only_the_dish(rgba):
    """Keep the largest object (the dish) and anything wholly inside its outline's box (a kickstand
    or mast that isn't quite touching), and drop the rest (a router standing beside it)."""
    a = rgba[..., 3]
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 8).astype(np.uint8), 8)
    big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = st[big, :4]
    keep = np.zeros(n, bool)
    keep[big] = True
    for i in range(1, n):
        xi, yi, wi, hi = st[i, :4]
        if xi >= x and yi >= y and xi + wi <= x + w and yi + hi <= y + h:
            keep[i] = True
    # the soft, faint edge pixels belong to whichever object they're next to; stray specks
    # elsewhere go
    near = cv2.dilate(keep[lab].astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    out = rgba.copy()
    out[..., 3] = np.where(near, a, 0)
    return out


def contact_shadow(alpha, size):
    """A soft shadow on the ground under the object's lowest few per cent."""
    h = alpha.shape[0]
    rows = np.nonzero(alpha.max(axis=1) > 40)[0]
    top, bottom = rows[0], rows[-1]
    foot = alpha[bottom - max(3, int((bottom - top) * 0.05)):bottom + 1] > 40
    xs = np.nonzero(foot.any(axis=0))[0]
    left, right = xs[0], xs[-1]
    shadow = Image.new('L', size, 0)
    sw, sh = (right - left) * 1.08 + 20, max(14, (right - left) * 0.07)
    cx, cy = (left + right) / 2, bottom + sh * 0.12
    ImageDraw.Draw(shadow).ellipse([cx - sw / 2, cy - sh / 2, cx + sw / 2, cy + sh / 2], fill=150)
    return shadow.filter(ImageFilter.GaussianBlur(sh * 0.45))


def make(path):
    rgba = np.array(Image.open(path).convert('RGBA'))
    rgba = only_the_dish(rgba)
    ys, xs = np.nonzero(rgba[..., 3] > 24)
    obj = Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    W, H = CANVAS
    room_w, room_h = W * (1 - 2 * MARGIN), H * (GROUND - MARGIN)
    s = min(room_w / obj.width, room_h / obj.height)
    obj = obj.resize((round(obj.width * s), round(obj.height * s)), Image.LANCZOS)
    x, y = (W - obj.width) // 2, round(H * GROUND) - obj.height
    layer = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    layer.paste(obj, (x, y))
    shadow = contact_shadow(np.array(layer)[..., 3], CANVAS)
    out = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    out.putalpha(shadow)
    out.alpha_composite(layer)
    name = path.stem
    out.save(OUT / f'{name}.webp', quality=QUALITY, method=6)
    print(f'{name}: {obj.width}x{obj.height} on {W}x{H}, {(OUT / f"{name}.webp").stat().st_size / 1024:.0f} KB')
    # the dish's middle and size, as percentages of the canvas: weighted by how bright and solid
    # each pixel is, so it lands on the panel rather than a dark mast or stand
    px = np.array(layer).astype(np.float32)
    wgt = px[..., 3] / 255 * (px[..., :3].mean(axis=2) / 255) ** 2
    ys, xs = np.mgrid[0:H, 0:W]
    cx, cy = (wgt * xs).sum() / wgt.sum(), (wgt * ys).sum() / wgt.sum()
    return name, {'x': round(cx / W * 100, 1), 'y': round(cy / H * 100, 1),
                  'w': round(obj.width / W * 100, 1), 'h': round(obj.height / H * 100, 1)}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    photos = sorted(p for p in PHOTOS.iterdir() if p.suffix in ('.webp', '.png'))
    if not photos:
        raise SystemExit(f'No photos in {PHOTOS}')
    geometry = dict(make(p) for p in photos)
    (OUT / 'geometry.json').write_text(json.dumps(geometry, indent=1) + '\n')
    print('geometry.json')


if __name__ == '__main__':
    main()
