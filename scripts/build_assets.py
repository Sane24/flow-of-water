#!/usr/bin/env python3
"""Copy, crop, and optimize project figures for the website.

Reads the original notebook outputs (never modifies them) and writes web copies to
public/images/, plus a manifest at src/data/manifest.json recording where every
figure came from. Run from the repository root:  python3 scripts/build_assets.py
"""
import base64
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RUN = "CS180_PartA_Site_Images/results/20261023-024719-711c45"
A = ROOT / RUN
OUT = ROOT / "public" / "images"
MANIFEST = ROOT / "src" / "data" / "manifest.json"

entries = []


def rel(p: Path) -> str:
    return p.relative_to(ROOT / "public").as_posix()


def save(im: Image.Image, dest: Path, lossless=False, quality=86):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.suffix == ".png":
        im.save(dest, optimize=True)
    else:
        im.convert("RGB").save(dest, "WEBP", quality=quality, lossless=lossless, method=6)
    return dest


def add(id, dest, source, kind="result", **meta):
    with Image.open(dest) as im:
        w, h = im.size
    entry = {"id": id, "src": rel(dest), "w": w, "h": h, "kind": kind, "source": source}
    entry.update({k: v for k, v in meta.items() if v is not None})
    entries.append(entry)
    return entry


# ---------------------------------------------------------------- panel cropping
def runs(mask, min_len):
    out, start = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and start is None:
            start = i
        if not v and start is not None:
            if i - start >= min_len:
                out.append((start, i))
            start = None
    return out


def detect_panels(im):
    """Find the image axes inside a matplotlib figure saved on a white background."""
    a = np.asarray(im.convert("RGB")).astype(int)
    nonwhite = a.min(axis=2) < 245
    boxes = []
    for y0, y1 in runs(nonwhite.mean(axis=1) > 0.15, 150):
        for x0, x1 in runs(nonwhite[y0:y1].mean(axis=0) > 0.5, 150):
            r = runs(nonwhite[y0:y1, x0:x1].mean(axis=1) > 0.5, 100)
            yy0, yy1 = (y0 + r[0][0], y0 + r[-1][1]) if r else (y0, y1)
            boxes.append((x0, yy0, x1, yy1))
    return boxes


# The 2 x 4 editing figures all share one layout; drawings with white areas confuse
# detection, so reuse the geometry measured on the Campanile figures.
EDIT_GRID = [(15, 25, 426, 435), (455, 25, 866, 435), (895, 25, 1306, 435), (1335, 25, 1746, 435),
             (15, 465, 426, 875), (455, 465, 866, 875), (895, 465, 1306, 875), (1335, 465, 1746, 875)]
TEXT_GRID = [(22, 52, 419, 449), (462, 52, 859, 449), (902, 52, 1299, 449), (1342, 52, 1739, 449),
             (22, 478, 419, 875), (462, 478, 859, 875), (902, 478, 1299, 875), (1342, 478, 1739, 875)]


def crop(im, box, inset=1):
    x0, y0, x1, y1 = box
    return im.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset))


def full_copy(name, folder="part-a/full"):
    """High quality copy of an entire original notebook figure, used for the lightbox."""
    dest = OUT / folder / (name + ".webp")
    with Image.open(A / (name + ".png")) as im:
        save(im, dest, quality=92)
    return rel(dest)


# ---------------------------------------------------------------- Part A, section 1
def part_a_core():
    src = f"{RUN}/training_inputs.png"
    im = Image.open(A / "training_inputs.png")
    boxes = detect_panels(im)
    assert len(boxes) == 4, boxes
    full = full_copy("training_inputs")
    labels = ["original", "t=0.25", "t=0.50", "t=0.75"]
    for box, lab in zip(boxes, labels):
        slug = "nighthouse-original" if lab == "original" else f"nighthouse-{lab.replace('=', '')}"
        d = save(crop(im, box), OUT / "part-a/training" / f"{slug}.webp")
        t = None if lab == "original" else float(lab[2:])
        add(f"a11-{slug}", d, src, kind="input" if t is None else "result", section="1.1", t=t, full=full,
            title="Original (512 × 512 crop)" if t is None else f"t = {lab[2:]}",
            alt="My night photo of a lit house under a cloudy moonlit sky" if t is None else
            f"The house photo linearly interpolated with Gaussian noise at t = {lab[2:]}")

    for t, sigma in [("0.25", "16"), ("0.5", "4"), ("0.75", "1")]:
        name = f"blur_{t}"
        im = Image.open(A / f"{name}.png")
        boxes = detect_panels(im)
        assert len(boxes) == 2, boxes
        full = full_copy(name)
        tt = f"{float(t):.2f}"
        for box, role in zip(boxes, ["noisy", "blur"]):
            d = save(crop(im, box), OUT / "part-a/denoising" / f"blur-t{tt}-{role}.webp")
            add(f"a12-t{tt}-{role}", d, f"{RUN}/{name}.png", section="1.2", t=float(t), full=full,
                sigma=float(sigma) if role == "blur" else None,
                title=f"Noisy, t = {tt}" if role == "noisy" else f"Gaussian blur of x_t/t, σ = {sigma}",
                alt=f"Noisy house at t = {tt}" if role == "noisy" else
                f"Amplitude-corrected noisy house blurred with sigma {sigma}")

    for t in ["0.25", "0.5", "0.75"]:
        name = f"one_step_{t}"
        im = Image.open(A / f"{name}.png")
        boxes = detect_panels(im)
        assert len(boxes) == 3, boxes
        full = full_copy(name)
        tt = f"{float(t):.2f}"
        for box, role in zip(boxes, ["original", "noisy", "onestep"]):
            if role == "original" and t != "0.25":
                continue
            d = save(crop(im, box), OUT / "part-a/denoising" / f"onestep-t{tt}-{role}.webp")
            add(f"a13-t{tt}-{role}", d, f"{RUN}/{name}.png", section="1.3", t=float(t), full=full,
                kind="input" if role == "original" else "result",
                title={"original": "Original", "noisy": f"Noisy, t = {tt}",
                       "onestep": f"One-step estimate from t = {tt}"}[role],
                alt={"original": "Original night photo of the house",
                     "noisy": f"Noisy house at t = {tt}",
                     "onestep": f"PixNerd one-step clean estimate from t = {tt}"}[role])

    for t in ["0.25", "0.50", "0.75"]:
        name = f"velocity_{t}"
        d = save(Image.open(A / f"{name}.png"), OUT / "part-a/velocity" / f"velocity-t{t}.webp", quality=94)
        add(f"a14-t{t}", d, f"{RUN}/{name}.png", section="1.4", t=float(t), full=rel(d),
            title=f"Velocity diagnostics at t = {t}",
            alt=f"Four panels at t = {t}: noisy image, predicted update, ground-truth update, and RGB RMS error heatmap")
    d = save(Image.open(A / "velocity_original.png"), OUT / "part-a/velocity" / "velocity-original.webp", quality=92)
    add("a14-original", d, f"{RUN}/velocity_original.png", kind="input", section="1.4",
        title="Original image (shown once)", alt="The original night photo of the house used for the velocity plots")

    im = Image.open(A / "trajectory.png")
    boxes = detect_panels(im)
    assert len(boxes) == 6, boxes
    full = full_copy("trajectory")
    for box, t in zip(boxes, ["0.50", "0.60", "0.70", "0.80", "0.90", "1.00"]):
        d = save(crop(im, box), OUT / "part-a/sampling" / f"euler-t{t}.webp")
        add(f"a15-euler-t{t}", d, f"{RUN}/trajectory.png", section="1.5", t=float(t), full=full,
            title=f"t = {t}", alt=f"Euler denoising trajectory state at t = {t}")

    im = Image.open(A / "comparison.png")
    boxes = detect_panels(im)
    assert len(boxes) == 4, boxes
    full = full_copy("comparison")
    for box, role, title in zip(boxes, ["original", "blur", "onestep", "euler"],
                                ["Original", "Gaussian blur (σ = 4)", "One-step estimate", "Euler, 25 steps"]):
        d = save(crop(im, box), OUT / "part-a/sampling" / f"compare-{role}.webp")
        add(f"a15-compare-{role}", d, f"{RUN}/comparison.png", section="1.5", t=0.5, full=full, title=title,
            kind="input" if role == "original" else "result",
            alt=f"{title} for the t = 0.50 noisy house")

    for i in range(5):
        seed = 180 + i
        d = save(Image.open(A / f"conditional_{i}.png"), OUT / "part-a/sampling" / f"conditional-seed{seed}.webp")
        add(f"a16-seed{seed}", d, f"{RUN}/conditional_{i}.png", section="1.6", seed=seed,
            prompt="a high quality photo", title=f"seed {seed}",
            alt=f"Sample generated from pure noise (seed {seed}) with the prompt 'a high quality photo', no guidance")
        d = save(Image.open(A / f"cfg_{i}.png"), OUT / "part-a/sampling" / f"cfg-seed{seed}.webp")
        add(f"a21-seed{seed}", d, f"{RUN}/cfg_{i}.png", section="2.1", seed=seed, w=7,
            prompt="a high quality photo", title=f"seed {seed}, w = 7",
            alt=f"Classifier-free guidance sample (w = 7, seed {seed}) with the prompt 'a high quality photo'")
    full_copy("conditional_samples")
    full_copy("cfg_samples")


# ---------------------------------------------------------------- Part A, section 3
STARTS = ["0.02", "0.04", "0.06", "0.10", "0.14", "0.25", "0.50"]

EDITS = [
    # (figure name, slug, display name, input source, alt description of input)
    ("edit_campanile", "campanile", "Campanile", "course-provided assets/campanile.jpg", "the Campanile clock tower"),
    ("edit_my_image_1", "nighthouse", "Night house (my photo)", "nighthouse.png", "my night photo of a house"),
    ("edit_my_image_2", "eye", "Eye close-up (my photo)", "eye-close.jpg", "my macro photo of an eye"),
    ("edit_web_image", "orange-cat", "Orange cat (web image)", "cat.jpg", "a downloaded photo of an orange cat"),
    ("edit_drawing_1", "malfoy", "Malfoy (my drawing)", "malfoy.png", "my drawing of a blonde Slytherin student"),
    ("edit_drawing_2", "keroppi", "Keroppi (my drawing)", "keroppi.png", "my pencil drawing of Keroppi the frog"),
    ("edit_drawing_3", "jeanne", "Jeanne, center crop (extra)", "Vampire Jeanne.png", "my line drawing of Jeanne"),
    ("edit_jeanne_full", "jeanne-full", "Jeanne, padded to square (extra)", "jeanne_square.png",
     "my Jeanne drawing padded to a square"),
    ("edit_malfoy_c", "malfoy-crop", "Malfoy, tighter crop (extra)", "malfoy-c.png", "a tighter crop of my Malfoy drawing"),
]

TEXT_EDITS = [
    ("text_edit_campanile", "campanile", "Campanile",
     "A realistic photograph of a towering white space rocket on a launch pad, surrounded by trees under a clear blue sky"),
    ("text_edit_my_image_1", "nighthouse", "Night house",
     "A cinematic photograph of a haunted Gothic Victorian mansion at night, glowing windows, beneath a bright full moon, surrounded by dramatic swirling storm clouds"),
    ("text_edit_my_image_2", "eye", "Eye close-up",
     "An extreme macro photograph of a human eye with a luminous galaxy swirling inside the iris, colorful cosmic nebulae, tiny stars, intricate details, realistic eyelashes"),
]


def part_a_edits():
    for fig, slug, name, source, desc in EDITS:
        im = Image.open(A / f"{fig}.png")
        full = full_copy(fig)
        for box, label in zip(EDIT_GRID, ["original"] + STARTS):
            d = save(crop(im, box), OUT / "part-a/editing" / slug / f"{'original' if label == 'original' else 't' + label}.webp")
            t = None if label == "original" else float(label)
            add(f"a31-{slug}-{label}", d, f"{RUN}/{fig}.png", kind="input" if t is None else "result",
                section="3.1", t=t, full=full, group=slug, groupTitle=name, inputSource=source,
                prompt="a high quality photo", w=7,
                title="Input" if t is None else f"t = {label}",
                alt=f"Preprocessed input: {desc}" if t is None else
                f"Edit of {desc} starting from t = {label} with the prompt 'a high quality photo'")

    for fig, slug, name, prompt in TEXT_EDITS:
        im = Image.open(A / f"{fig}.png")
        full = full_copy(fig)
        for box, label in zip(TEXT_GRID, ["original"] + STARTS):
            d = save(crop(im, box), OUT / "part-a/text-editing" / slug / f"{'original' if label == 'original' else 't' + label}.webp")
            t = None if label == "original" else float(label)
            add(f"a32-{slug}-{label}", d, f"{RUN}/{fig}.png", kind="input" if t is None else "result",
                section="3.2", t=t, full=full, group=slug, groupTitle=name, prompt=prompt, w=7,
                title="Input" if t is None else f"t = {label}",
                alt=f"Input image: {name}" if t is None else f"Text-guided edit of the {name} from t = {label}")


ANAGRAMS = [
    ("0", "old-man-campfire", 180, "an oil painting of an old man", "an oil painting of people around a campfire", True),
    ("1", "village-horse", 181, "a lithograph of a snowy mountain village", "a lithograph of a horse", True),
    ("2", "cat-ocean", 182, "an oil painting of a black cat's face",
     "an oil painting of foamy ocean waves crashing on rocks", True),
    ("volcano_wine", "volcano-wine", 190, "an oil painting of an erupting volcano with glowing red lava",
     "an oil painting of a crystal wine glass filled with red wine", True),
    ("3", "eye-moon", 183, "a surreal painting of a giant human eye",
     "a surreal painting of a moonlit sky filled with swirling clouds", False),
    ("4", "hourglass-beach", 184, "a painting of an antique hourglass filled with sand",
     "a painting of golden sand and ocean waves on a beach", False),
]

HYBRIDS = [
    ("0", "skull-waterfall", 180, "a lithograph of a skull", "a lithograph of a waterfall"),
    ("1", "cat-forest", 181, "a lithograph of a cat", "a lithograph of a forest"),
    ("3", "hourglass-beach", 183, "a painting of an antique hourglass filled with sand",
     "a painting of golden sand and ocean waves on a beach"),
    ("4", "butterfly-glass", 184, "a colorful illustration of a butterfly with its wings spread symmetrically",
     "a colorful illustration of intricate Gothic stained glass windows"),
    ("2", "face-clockwork", 182, "a black and white lithograph of a human face looking forward",
     "a black and white lithograph of intricate mechanical gears and clockwork machinery"),
    ("face_clockwork_improved", "face-clockwork-revised", 190,
     "a minimalist black and white portrait of a human face, front facing, simple features, broad smooth shadows",
     "a detailed black and white engraving of hundreds of interlocking clockwork gears and cogwheels filling the entire frame, sharp metal teeth, intricate spokes, springs and tiny mechanical parts"),
]


def part_a_illusions():
    for key, slug, seed, pa, pb, featured in ANAGRAMS:
        for suffix, prompt, label in [("", pa, "upright"), ("_rotated", pb, "rotated")]:
            d = save(Image.open(A / f"anagram_{key}{suffix}.png"), OUT / "part-a/anagrams" / f"{slug}-{label}.webp", quality=90)
            add(f"a33-{slug}-{label}", d, f"{RUN}/anagram_{key}{suffix}.png", section="3.3", seed=seed, w=7,
                group=slug, prompt=prompt, promptA=pa, promptB=pb, featured=featured, view=label,
                title=f"{label.capitalize()}: “{prompt}”",
                alt=f"Visual anagram, {label}: reads as {prompt}")
        full_copy(f"anagram_views_{key}")

    for key, slug, seed, distant, close in HYBRIDS:
        d = save(Image.open(A / f"hybrid_{key}.png"), OUT / "part-a/hybrids" / f"{slug}-near.webp", quality=92)
        add(f"a34-{slug}-near", d, f"{RUN}/hybrid_{key}.png", section="3.4", seed=seed, w=7, group=slug,
            prompt=close, promptFar=distant, promptNear=close, view="near",
            title="Full resolution (512 × 512)", alt=f"Hybrid image at full size; up close it reads as {close}")
        dest = OUT / "part-a/hybrids" / f"{slug}-far64.png"
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(A / f"hybrid_{key}_distant64.png", dest)
        add(f"a34-{slug}-far", dest, f"{RUN}/hybrid_{key}_distant64.png", section="3.4", seed=seed, w=7,
            group=slug, prompt=distant, promptFar=distant, promptNear=close, view="far",
            title="Distant view (64 × 64)", alt=f"The same hybrid downsampled to 64 by 64; from afar it should read as {distant}")


# ---------------------------------------------------------------- Part B
PART_B = [
    ("part1_2_noising", "denoising/noising-sigmas", "1.2", "plot", "Noising process",
     "MNIST digit 5 with Gaussian noise added at sigma 0.0, 0.2, 0.4, 0.5, 0.6, 0.8 and 1.0"),
    ("part1_2_1_denoising_loss", "denoising/denoiser-loss", "1.2.1", "plot", "Training loss, σ = 0.5 denoiser",
     "Training loss curve for the sigma 0.5 denoiser over 1,175 optimizer steps"),
    ("denoiser_epoch_1", "denoising/denoiser-epoch1", "1.2.1", "result", "Epoch 1",
     "Rows of noisy test digits, denoised outputs after epoch 1, and clean originals"),
    ("denoiser_epoch_5", "denoising/denoiser-epoch5", "1.2.1", "result", "Epoch 5",
     "Rows of noisy test digits, denoised outputs after epoch 5, and clean originals"),
    ("part1_2_2_ood_testing", "denoising/ood-sigmas", "1.2.2", "result", "Out-of-distribution noise levels",
     "A test digit 7 noised at sigma 0 to 1 and the sigma 0.5 denoiser's outputs"),
    ("pure_noise_epoch_1", "denoising/pure-noise-epoch1", "1.2.3", "result", "Pure noise, epoch 1",
     "Ten pure noise inputs and their nearly identical blurry outputs after epoch 1"),
    ("pure_noise_epoch_5", "denoising/pure-noise-epoch5", "1.2.3", "result", "Pure noise, epoch 5",
     "Ten pure noise inputs and their nearly identical blurry outputs after epoch 5"),
    ("part1_2_3_pure_noise_loss", "denoising/pure-noise-loss", "1.2.3", "plot", "Training loss, pure noise",
     "Training loss curve for the pure noise denoiser, flattening after about 150 steps"),
    ("part2_2_time_conditioned_loss", "flow-matching/time-fm-loss", "2.2", "plot",
     "Training loss, time-conditioned UNet", "Training loss for the time-conditioned flow matching UNet over 9,380 steps"),
    ("time_fm_epoch_1", "flow-matching/time-fm-epoch1", "2.3", "result", "Epoch 1",
     "Ten digits sampled from the time-conditioned model after epoch 1, mostly scribbles"),
    ("time_fm_epoch_5", "flow-matching/time-fm-epoch5", "2.3", "result", "Epoch 5",
     "Ten digits sampled from the time-conditioned model after epoch 5"),
    ("time_fm_epoch_10", "flow-matching/time-fm-epoch10", "2.3", "result", "Epoch 10",
     "Ten digits sampled from the time-conditioned model after epoch 10"),
    ("part2_3_sampling_comparison", "flow-matching/time-fm-epochs-1-5-10", "2.3", "result",
     "Same noise, epochs 1, 5 and 10", "Three rows of samples from the same starting noise after epochs 1, 5 and 10"),
    ("class_fm_scheduled_epoch_1_samples", "class-conditioning/class-fm-epoch1", "2.6", "result", "Epoch 1",
     "Four rows of class-conditioned digits 0 to 9 after epoch 1, rough and noisy"),
    ("class_fm_scheduled_epoch_5_samples", "class-conditioning/class-fm-epoch5", "2.6", "result", "Epoch 5",
     "Four rows of class-conditioned digits 0 to 9 after epoch 5"),
    ("class_fm_scheduled_epoch_10_samples", "class-conditioning/class-fm-epoch10", "2.6", "result", "Epoch 10",
     "Four rows of class-conditioned digits 0 to 9 after epoch 10"),
    ("class_fm_no_scheduler_epoch_10_samples", "class-conditioning/class-fm-noscheduler-epoch10", "2.6", "result",
     "Epoch 10, constant LR 2e-3", "Four rows of digits 0 to 9 from the model trained without a scheduler"),
    ("class_fm_scheduler_comparison", "class-conditioning/scheduler-loss-comparison", "2.6", "plot",
     "Average loss per epoch, scheduled vs constant", "Per-epoch average training loss for the exponential schedule and the constant 2e-3 learning rate"),
    ("part2_6_scheduler_visual_comparison", "class-conditioning/scheduler-visual-comparison", "2.6", "result",
     "Epoch 10: scheduled (top four rows) vs constant (bottom four rows)",
     "Eight rows of digits, the top four from the scheduled run and the bottom four from the constant learning rate run"),
]


def notebook_png(nb_path, cell_index, output_number=0):
    nb = json.loads(Path(nb_path).read_text())
    k = 0
    for o in nb["cells"][cell_index].get("outputs", []):
        data = o.get("data", {})
        if "image/png" in data:
            if k == output_number:
                b = data["image/png"]
                return base64.b64decode("".join(b) if isinstance(b, list) else b)
            k += 1
    raise KeyError((nb_path, cell_index, output_number))


def part_b():
    for name, slug, section, kind, title, alt in PART_B:
        dest = OUT / "part-b" / f"{slug}.png"
        save(Image.open(ROOT / f"{name}.png"), dest)
        add(f"b-{slug.split('/')[-1]}", dest, f"{name}.png", kind=kind, section=section, title=title, alt=alt)

    # The two class-conditioned training curves were displayed in the notebook but never
    # written to disk locally, so they are recovered from the saved notebook outputs.
    nb = ROOT / "CS180_partb.ipynb"
    for cell, slug, title in [(47, "class-fm-loss-scheduled", "Training loss, class-conditioned (exponential LR)"),
                              (48, "class-fm-loss-constant", "Training loss, class-conditioned (constant LR 2e-3)")]:
        dest = OUT / "part-b/class-conditioning" / f"{slug}.png"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(notebook_png(nb, cell))
        add(f"b-{slug}", dest, f"CS180_partb.ipynb (cell {cell} output)", kind="plot", section="2.5", title=title,
            alt=f"{title} over 9,380 optimizer steps")


# ---------------------------------------------------------------- hero / decorative
def hero():
    d = save(Image.open(A / "anagram_2.png"), OUT / "hero" / "cat-ocean-anagram.webp", quality=90)
    add("hero-cat-ocean", d, f"{RUN}/anagram_2.png", section="3.3", seed=182,
        title="Black cat / ocean waves anagram", alt="My visual anagram of a black cat's face that turns into ocean waves upside down")


def decorative():
    for p in sorted((OUT / "decorative").glob("*.webp")):
        add(f"decor-{p.stem}", p, "see CREDITS.md", kind="decorative", title=p.stem)


if __name__ == "__main__":
    for sub in ["part-a", "part-b", "hero"]:
        shutil.rmtree(OUT / sub, ignore_errors=True)
    part_a_core()
    part_a_edits()
    part_a_illusions()
    part_b()
    hero()
    decorative()
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(entries, indent=1, ensure_ascii=False) + "\n")
    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"{len(entries)} manifest entries, {total / 1e6:.1f} MB in public/images")
