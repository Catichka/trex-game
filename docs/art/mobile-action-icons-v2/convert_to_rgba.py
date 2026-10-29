#!/usr/bin/env python3
"""Convert the eight approved mobile icon PNGs to the PNG-32/RGBA art contract.

Run from any working directory:
    python3 docs/art/mobile-action-icons-v2/convert_to_rgba.py

Requires Pillow. Only rewrites art files in assets/ui; does not touch engine,
CSS, manifests or gameplay. The pixel colours and alpha values are preserved.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ASSETS = ROOT / "assets" / "ui"
STEMS = ("jump", "bite", "rawr", "rawr_charged")


def convert(path: Path, size: int) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(f"Missing required production icon: {path}")
    with Image.open(path) as original:
        if original.format != "PNG":
            raise ValueError(f"{path}: expected PNG, got {original.format}")
        if original.size != (size, size):
            raise ValueError(f"{path}: expected {size}x{size}, got {original.size}")
        rgba = original.convert("RGBA")
    if not any(alpha < 255 for alpha in rgba.getchannel("A").getdata()):
        raise ValueError(f"{path}: no transparent pixels found")
    # Pixel-perfect conversion: palette indices are resolved into actual RGBA.
    rgba.save(path, format="PNG", optimize=True)
    with Image.open(path) as check:
        if check.mode != "RGBA" or check.size != (size, size):
            raise AssertionError(f"{path}: PNG-32 RGBA validation failed")
        if list(check.getdata()) != list(rgba.getdata()):
            raise AssertionError(f"{path}: pixel values changed during conversion")
    return rgba


def main() -> None:
    for stem in STEMS:
        small = convert(ASSETS / f"{stem}_32.png", 32)
        large = convert(ASSETS / f"{stem}_64.png", 64)
        expected = small.resize((64, 64), Image.Resampling.NEAREST)
        if large.tobytes() != expected.tobytes():
            raise ValueError(
                f"{stem}: 64px is not an exact nearest-neighbour 2x of 32px; "
                "review art before merging"
            )
        print(f"PASS {stem}: RGBA 32/64px, alpha, exact 2x")
    print("All eight production PNGs now satisfy the PNG-32/RGBA contract.")


if __name__ == "__main__":
    main()
