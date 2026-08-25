#!/usr/bin/env python3
"""Generate the app's icon set from a single source image.

Usage
-----
    python tools/generate-icons.py [source]

`source` defaults to icon.png in the repository root. Any format Pillow can
read works (png, jpg, webp, ...); it does not need to be square or 512px,
though a square image of at least 512x512 gives the best result.

Why the outputs differ
----------------------
Browser tabs and mobile home screens want different things:

* Browser favicons keep a rounded plate with transparent corners, which is
  what a tab expects.
* iOS and Android apply their own mask to home screen icons. A pre-rounded
  icon gets masked twice, and iOS composites transparent corners onto black,
  producing dark wedges. So those icons are full bleed and fully opaque.
* Android additionally crops maskable icons to a circle or squircle, so the
  artwork there is held inside the safe zone (the centre 80% of the canvas).

If the source has transparent corners (a pre-rounded plate), the transparency
is filled by growing the nearest opaque colour outward, so the full-bleed
icons extend the artwork rather than showing a flat matte.

Requires: pillow, numpy
"""

from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SOURCE = os.path.join(ROOT, "icon.png")
OUT_DIR = os.path.join(ROOT, "icons")

# Corner radius of the browser favicon plate, as a fraction of the icon size.
# 0.22 matches a typical iOS style squircle closely enough at small sizes.
FAVICON_RADIUS_RATIO = 0.22

# Fraction of the canvas the artwork occupies in the maskable icon. Android's
# safe zone is the centre 80%; 0.76 leaves a little margin on top of that.
MASKABLE_ART_SCALE = 0.76

# Work at this resolution before downsampling, so edges stay clean.
WORK = 1024


def load_source(path: str) -> Image.Image:
    if not os.path.exists(path):
        sys.exit(f"source image not found: {path}")
    img = Image.open(path).convert("RGBA")

    # Trim fully transparent padding so the artwork fills the canvas.
    bbox = img.getbbox()
    if bbox and bbox != (0, 0, img.width, img.height):
        img = img.crop(bbox)

    # Pad to a square without distorting the aspect ratio.
    side = max(img.size)
    if img.size != (side, side):
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        square.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
        img = square

    return img.resize((WORK, WORK), Image.LANCZOS)


def _grow(rgb: np.ndarray, known: np.ndarray) -> np.ndarray:
    """Flood the nearest known colour outward until every pixel is covered."""
    rgb = rgb.copy()
    rgb[~known] = 0.0
    filled = known.copy()

    # A pass propagates one pixel, so the diagonal is the worst case.
    for _ in range(sum(filled.shape)):
        if filled.all():
            break
        total = np.zeros_like(rgb)
        count = np.zeros(filled.shape, np.float32)
        for axis, shift in ((0, 1), (0, -1), (1, 1), (1, -1)):
            total += np.roll(rgb * filled[..., None], shift, axis=axis)
            count += np.roll(filled.astype(np.float32), shift, axis=axis)
        newly = (~filled) & (count > 0)
        if not newly.any():
            break
        rgb[newly] = total[newly] / count[newly, None]
        filled |= newly
    return rgb


def fill_transparency(img: Image.Image) -> Image.Image:
    """Extend the artwork into transparent pixels, then drop the alpha.

    A pre-rounded source has transparent corners. Flattening those onto a flat
    colour leaves visible wedges once the OS applies its own, slightly
    different mask, so the artwork is grown outward instead.

    The flood runs on a small copy and is upscaled: the corners only need a
    smooth continuation of the edge colour, and doing it at full resolution
    would mean hundreds of passes over a 1024x1024 array.
    """
    arr = np.array(img)
    known = arr[..., 3] > 8

    if known.all():
        return img.convert("RGBA")
    if not known.any():
        sys.exit("source image is fully transparent")

    small = img.resize((128, 128), Image.LANCZOS)
    s_arr = np.array(small).astype(np.float32)
    s_known = s_arr[..., 3] > 8
    grown = _grow(s_arr[..., :3], s_known)

    backdrop = Image.fromarray(grown.clip(0, 255).astype(np.uint8), "RGB")
    backdrop = backdrop.resize(img.size, Image.LANCZOS)

    # Keep the original crisp pixels; the flood only supplies what was missing.
    out = backdrop.convert("RGBA")
    out.paste(img, (0, 0), img)
    return Image.alpha_composite(Image.new("RGBA", img.size, (0, 0, 0, 255)), out)


def rounded(img: Image.Image, radius_ratio: float) -> Image.Image:
    """Clip to a rounded square, leaving the corners transparent."""
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255
    )
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def inset(img: Image.Image, scale: float) -> Image.Image:
    """Shrink the artwork and replicate its edge pixels out to the canvas.

    Padding by edge replication rather than compositing over a full size copy,
    which would leave the original plate visible as a second square behind the
    shrunken one.
    """
    size = img.size[0]
    small = img.convert("RGB").resize(
        (int(size * scale), int(size * scale)), Image.LANCZOS)
    before = (size - small.width) // 2
    after = size - small.width - before
    padded = np.pad(
        np.array(small),
        ((before, after), (before, after), (0, 0)),
        mode="edge",
    )
    return Image.fromarray(padded).convert("RGBA")


def save(img: Image.Image, size: int, name: str, opaque: bool) -> None:
    out = img.resize((size, size), Image.LANCZOS)
    if opaque:
        flat = Image.new("RGB", out.size, (255, 255, 255))
        flat.paste(out, mask=out.split()[3])
        out = flat
    path = os.path.join(OUT_DIR, name)
    out.save(path, "PNG")
    print(f"  {name:26} {out.size[0]:>4}x{out.size[1]:<4} {out.mode:5} "
          f"{os.path.getsize(path):>7,} B")


def main() -> None:
    source_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SOURCE
    os.makedirs(OUT_DIR, exist_ok=True)

    print(f"source: {source_path}")
    art = load_source(source_path)

    bleed = fill_transparency(art)          # opaque, edge to edge
    plate = rounded(bleed, FAVICON_RADIUS_RATIO)
    maskable = inset(bleed, MASKABLE_ART_SCALE)

    print("\nbrowser (rounded plate, transparent corners):")
    save(plate, 16, "favicon-16.png", opaque=False)
    save(plate, 32, "favicon-32.png", opaque=False)
    save(plate, 48, "icon-48.png", opaque=False)

    print("\nhome screen (full bleed, opaque - the OS applies its own mask):")
    save(bleed, 180, "apple-touch-icon-180.png", opaque=True)
    save(bleed, 192, "icon-192.png", opaque=True)
    save(bleed, 512, "icon-512.png", opaque=True)
    save(maskable, 512, "icon-maskable-512.png", opaque=True)

    print("\nDone. Icons are referenced from index.html and manifest.json;")
    print("neither needs editing unless you rename or add a file.")
    print("On iPhone, delete the existing home screen icon and re-add the")
    print("site - iOS caches the old icon otherwise.")


if __name__ == "__main__":
    main()
