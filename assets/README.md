# Starlink card images and typeface

## `photos/`

Starlink's product photos, one per dish, as published on starlink.com. They're the originals the
card's images are made from. They come already cut out, on a transparent background.

| File | Dish | Starlink image |
|---|---|---|
| `standard.webp` | Standard (the V4 dish; this photo is of the Standard 4X kit, with Router 3) | [Starlink_Standard4x_1000px.webp](https://starlink.com/assets-new/images/specifications/Starlink_Standard4x_1000px.webp) |
| `v5.webp` | Starlink V5 (with Router Mini) | [Starlink_v5_1000px.webp](https://starlink.com/assets-new/images/specifications/Starlink_v5_1000px.webp) |
| `mini.webp` | Mini | [Starlink_Mini_1000px.webp](https://starlink.com/assets-new/images/specifications/Starlink_Mini_1000px.webp) |
| `standard_actuated.webp` | Standard Actuated | [Starlink_Actuated_1000px.webp](https://starlink.com/assets-new/images/specifications/Starlink_Actuated_1000px.webp) |
| `performance_gen_3.webp` | Performance (Gen 3) | [Starlink_Performance3_1000px.webp](https://starlink.com/assets-new/images/specifications/Starlink_Performance3_1000px.webp) |
| `performance_gen_2.webp` | Performance (Gen 2), formerly Flat High Performance, on its wedge mount | [Starlink_Performance2_1000px.webp](https://starlink.com/assets-new/images/specifications/Starlink_Performance2_1000px.webp) |
| `performance_gen_1.webp` | Performance (Gen 1), formerly High Performance | [Starlink_Performance1_1000px.webp](https://starlink.com/assets-new/images/specifications/Starlink_Performance1_1000px.webp) |
| `enterprise.webp` | Enterprise, on its mast | [Starlink_Enterprise_1000px.webp](https://starlink.com/assets-new/images/specifications/Starlink_Enterprise_1000px.webp) |
| `standard_circular.png` | Standard Circular, the original round dish | [Circular_500x500.png](https://starlink.com/public-files/Circular_500x500.png) |

The Standard 4 and Mini X kits use the same dishes as the Standard 4X and Mini, so they share those
images.

## `dishes/`

The images the card uses, made from `photos/` by `tools/make_dishes.py`. For each dish it:

- keeps only the dish, dropping a router standing beside it (the Standard and V5 photos)
- scales it to fill a 1120 × 600 canvas without cropping, standing on the same ground line as every
  other dish, with a soft contact shadow underneath

It also writes `geometry.json`, where each dish sits on its canvas, which the card uses to centre
the snow-melt glow on the dish.

To make them again (from the repository root):

```sh
pip install -r tools/requirements.txt
python tools/make_dishes.py
python tools/build.py
```

To add a new dish, put Starlink's photo in `photos/` named after the dish, run the two commands
above, and add it to `DISHES` and `MODELS` in `src/starlink-dish-card.js`.

These images are Starlink's and aren't covered by this repository's MIT licence.

## `fonts/`

[D-DIN](https://www.datto.com/fonts/d-din) Regular and Bold by Datto, as WOFF2, under the SIL Open
Font Licence 1.1 (`OFL-1.1.txt`). Starlink's website uses a DIN typeface; D-DIN is a free one that's
very close.
