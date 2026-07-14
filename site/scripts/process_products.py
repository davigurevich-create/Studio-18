import sys
import cv2
import numpy as np
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent.parent / "raw-products"
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "products"
CANVAS = 1600

CARBON_1 = (0x0c, 0x0c, 0x0c)  # BGR-agnostic, same per channel below via hex->bgr
CARBON_3 = (0x1d, 0x1d, 0x1d)
GOLD = (0x4d, 0xa4, 0xcd)  # BGR order for cv2 (from #cda44d)


def hex_to_bgr(h):
    h = h.lstrip('#')
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return np.array([b, g, r], dtype=np.float64)


def build_background(size):
    c1 = hex_to_bgr('0c0c0c')
    c3 = hex_to_bgr('1d1d1d')
    gold = hex_to_bgr('cda44d')

    yy, xx = np.mgrid[0:size, 0:size].astype(np.float64)
    # linear-gradient(160deg, carbon-3 -> carbon-1): 160deg from vertical, roughly top-left(ish) to bottom-right
    angle = np.deg2rad(160 - 90)
    dx, dy = np.cos(angle), np.sin(angle)
    proj = (xx / size) * dx + (yy / size) * dy
    proj = (proj - proj.min()) / (proj.max() - proj.min())
    bg = c3[None, None, :] * (1 - proj[..., None]) + c1[None, None, :] * proj[..., None]

    # soft gold radial glow at 50% 30%, fading by 60% of size, alpha ~0.10
    cx, cy = size * 0.5, size * 0.3
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (size * 0.6)
    glow_alpha = np.clip(1 - dist, 0, 1) ** 2 * 0.13
    bg = bg * (1 - glow_alpha[..., None]) + gold[None, None, :] * glow_alpha[..., None]

    return bg


def extract_foreground_mask(img_bgr):
    h, w = img_bgr.shape[:2]
    flood_mask = np.zeros((h + 2, w + 2), np.uint8)
    filled = np.zeros((h, w), np.uint8)

    work = img_bgr.copy()
    seeds = []
    step = 24
    for x in range(0, w, step):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(0, h, step):
        seeds.append((0, y))
        seeds.append((w - 1, y))

    loDiff = (12, 12, 12)
    upDiff = (12, 12, 12)
    flags = 4 | (255 << 8) | cv2.FLOODFILL_FIXED_RANGE

    for (x, y) in seeds:
        if filled[y, x]:
            continue
        cv2.floodFill(work, flood_mask, (x, y), 0, loDiff, upDiff, flags)
        filled = np.maximum(filled, (flood_mask[1:-1, 1:-1] > 0).astype(np.uint8) * 255)

    # sure background = border-connected flood fill, eroded a touch so the
    # GrabCut boundary sits inside it rather than right on the object edge
    sure_bg = cv2.erode(filled, np.ones((3, 3), np.uint8), iterations=1)

    gc_mask = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    gc_mask[sure_bg > 0] = cv2.GC_BGD

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(img_bgr, gc_mask, None, bgd_model, fgd_model, 6, cv2.GC_INIT_WITH_MASK)

    foreground_mask = np.where(
        (gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD), 255, 0
    ).astype(np.uint8)

    # clean small speckles, then close small gaps inside the object
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    foreground_mask = cv2.morphologyEx(foreground_mask, cv2.MORPH_OPEN, kernel)
    kernel2 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    foreground_mask = cv2.morphologyEx(foreground_mask, cv2.MORPH_CLOSE, kernel2)

    # keep only largest connected component (the product itself)
    num, labels, stats, _ = cv2.connectedComponentsWithStats(foreground_mask, connectivity=8)
    if num > 1:
        largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        foreground_mask = np.where(labels == largest, 255, 0).astype(np.uint8)

    # feather edges
    foreground_mask = cv2.GaussianBlur(foreground_mask, (7, 7), 0)
    return foreground_mask


# a few source photos were shot on a reflective floor, whose mirrored
# duplicate of the product reads as extra foreground; clip the search area
# to the fraction of the image height (from the top) known to be clean
CROP_BOTTOM_FRACTION = {
    "S18-003": 0.66,
}


def process_one(path: Path, out_path: Path):
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    mask = extract_foreground_mask(img)

    frac = CROP_BOTTOM_FRACTION.get(path.stem)
    if frac:
        cutoff = int(img.shape[0] * frac)
        mask[cutoff:, :] = 0

    ys, xs = np.where(mask > 10)
    if len(xs) == 0:
        raise RuntimeError(f"no foreground found in {path.name}")
    pad = int(0.04 * max(img.shape[:2]))
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, img.shape[1])
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, img.shape[0])

    crop = img[y0:y1, x0:x1]
    crop_mask = mask[y0:y1, x0:x1]

    ch, cw = crop.shape[:2]
    scale = (CANVAS * 0.86) / max(ch, cw)
    new_w, new_h = int(cw * scale), int(ch * scale)
    crop_resized = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_AREA)
    mask_resized = cv2.resize(crop_mask, (new_w, new_h), interpolation=cv2.INTER_AREA)

    bg = build_background(CANVAS)

    # contact shadow
    shadow = np.zeros((CANVAS, CANVAS), np.float64)
    off_x = (CANVAS - new_w) // 2
    off_y = (CANVAS - new_h) // 2 + int(new_h * 0.06)
    shadow_cx = off_x + new_w // 2
    shadow_cy = min(off_y + new_h - int(new_h * 0.04), CANVAS - 1)
    axes = (int(new_w * 0.36), int(new_h * 0.06))
    cv2.ellipse(shadow, (shadow_cx, shadow_cy), axes, 0, 0, 360, 1.0, -1)
    shadow = cv2.GaussianBlur(shadow, (0, 0), sigmaX=max(new_w, new_h) * 0.03)
    shadow = np.clip(shadow, 0, 1) * 0.55
    bg = bg * (1 - shadow[..., None])

    canvas = bg.copy()
    off_y2 = (CANVAS - new_h) // 2 - int(new_h * 0.02)
    off_x2 = (CANVAS - new_w) // 2
    y0c, y1c = max(off_y2, 0), min(off_y2 + new_h, CANVAS)
    x0c, x1c = max(off_x2, 0), min(off_x2 + new_w, CANVAS)
    sy0, sy1 = y0c - off_y2, y1c - off_y2
    sx0, sx1 = x0c - off_x2, x1c - off_x2

    alpha = (mask_resized[sy0:sy1, sx0:sx1].astype(np.float64) / 255.0)[..., None]
    region = canvas[y0c:y1c, x0c:x1c]
    fg_region = crop_resized[sy0:sy1, sx0:sx1].astype(np.float64)
    canvas[y0c:y1c, x0c:x1c] = region * (1 - alpha) + fg_region * alpha

    canvas = np.clip(canvas, 0, 255).astype(np.uint8)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_path), canvas, [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == "__main__":
    targets = sys.argv[1:] or sorted(p.stem for p in RAW_DIR.glob("S18-*.png"))
    for sku in targets:
        src = RAW_DIR / f"{sku}.png"
        if not src.exists():
            print(f"skip {sku}: not found")
            continue
        dst = OUT_DIR / f"{sku}.jpg"
        process_one(src, dst)
        print(f"done {sku} -> {dst}")
