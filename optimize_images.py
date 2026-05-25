"""Optimize large images in themes/assets/ by resizing and converting to WebP."""
from PIL import Image
import os
import shutil

ASSETS = "themes/assets"
BACKUP = "themes/assets/originals"
MAX_DIM = 2048
QUALITY = 82
MIN_SIZE = 500_000  # only process files > 500KB

os.makedirs(BACKUP, exist_ok=True)

total_before = 0
total_after = 0
skipped = []

for fname in sorted(os.listdir(ASSETS)):
    fpath = os.path.join(ASSETS, fname)
    if not os.path.isfile(fpath):
        continue

    size = os.path.getsize(fpath)
    ext = os.path.splitext(fname)[1].lower()
    if ext not in (".png", ".jpg", ".jpeg", ".webp"):
        continue
    if size < MIN_SIZE:
        skipped.append((fname, size))
        continue

    try:
        img = Image.open(fpath)
    except Exception as e:
        print(f"  SKIP {fname}: can't open ({e})")
        continue

    orig_size = img.size
    # Resize if either dimension exceeds MAX_DIM
    if max(img.size) > MAX_DIM:
        img.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)

    # Convert RGBA to RGB with white background for WebP lossy
    if img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Save as WebP
    name_no_ext = os.path.splitext(fname)[0]
    out_name = name_no_ext + ".webp"
    out_path = os.path.join(ASSETS, out_name)

    # Don't overwrite a different file that already exists
    if out_path != fpath and os.path.exists(out_path) and out_path != fpath:
        # If we'd be creating a duplicate name, skip
        print(f"  SKIP {fname}: {out_name} already exists")
        continue

    # Backup original
    backup_path = os.path.join(BACKUP, fname)
    if not os.path.exists(backup_path):
        shutil.copy2(fpath, backup_path)

    img.save(out_path, "WEBP", quality=QUALITY, method=6)
    new_size = os.path.getsize(out_path)

    # Remove original if it was a different format
    if ext != ".webp" and os.path.exists(fpath):
        os.remove(fpath)

    total_before += size
    total_after += new_size
    ratio = (1 - new_size / size) * 100
    print(f"  {fname:50s} {size/1024/1024:5.1f}M -> {out_name:50s} {new_size/1024/1024:5.1f}M  ({ratio:.0f}% smaller)  {orig_size[0]}x{orig_size[1]} -> {img.size[0]}x{img.size[1]}")

print(f"\n  Total: {total_before/1024/1024:.1f}M -> {total_after/1024/1024:.1f}M  ({(1-total_after/total_before)*100:.0f}% reduction)")
print(f"  Originals backed up to {BACKUP}/")
if skipped:
    print(f"  Skipped {len(skipped)} small files (< 500KB)")
