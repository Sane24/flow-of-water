# Flow of Water

An interactive illustrated field journal for UC Berkeley CS180 Project 3 (Fall 2026).

**Website:** https://sane24.github.io/flow-of-water/
**Repository:** https://github.com/Sane24/flow-of-water

## Preview

Open `index.html` in a browser. For the most reliable preview with local assets, run `python3 -m http.server 8000` and open `http://localhost:8000/`.

No Node installation, build step, or backend is required. The site is plain HTML, CSS, and JavaScript. It includes reduced-motion support, mobile layouts, a simulated forward-flow explorer, interactive image lightbox, 180-degree anagrams, near/far hybrid views, and PDF print styles.

`printindex.html` is the earlier portable print-first report. The interactive `index.html` has its own print CSS, and its **Save as PDF** button prints the complete report. Images present in the original project folder are loaded automatically where the output filenames match.

## Add to your original flow folder

**Important:** The ZIP is a website bundle, not a copy of your 54 MB notebook or all your Kaggle outputs. The interactive page contains 26 compressed screenshot figures to make it useful immediately, but your four anagram and six hybrid images, the Part A text-guided editing results, and the clean full-resolution notebook figures must be connected from your local images.

Unzip the site bundle and copy **its contents** directly into your existing `flow/` folder, at the same level as the notebooks and `CS180_PartA_Site_Images/`. This makes the original paths work.

```text
flow/
  index.html                         <-- website landing page
  printindex.html                    <-- existing print-first report
  style.css
  script.js
  assets/
    figures/                         <-- backed-up screenshot previews
    original/                        <-- art references
    experiments/                     <-- curated experiment PNGs, see below
  CS180_PartA_Site_Images/           <-- your Kaggle export, unchanged
    results/<run-id>/*.png
  cs-180-project-3a.ipynb
  CS180_partb.ipynb
  class_fm_scheduler_comparison.png
  ... your other existing Part B result images
```

## Curated anagram and hybrid files

If the website can't find an original saved image, that experiment displays a deliberately labeled empty frame, **not an invented model result**. To ensure the showcases show the correct artwork, copy the output for each selected experiment into `assets/experiments/` using the following names. These take priority over the automatic original-folder lookup.

| Site section | Output you choose | Curated filename |
| --- | --- | --- |
| 3.3 | Old man / Campfire | `anagram_0.png` |
| 3.3 | Mountain village / Horse | `anagram_1.png` |
| 3.3 | Black cat / Ocean waves | `anagram_2.png` |
| 3.3 | Volcano / Red wine glass | `anagram_3.png` |
| 3.4 | Skull / Waterfall | `hybrid_0.png` |
| 3.4 | Cat / Forest | `hybrid_1.png` |
| 3.4 | Hourglass / Ocean waves + sand | `hybrid_2.png` |
| 3.4 | Butterfly / Stained glass | `hybrid_3.png` |
| 3.4 | Human / Clockwork, original run | `hybrid_4.png` |
| 3.4 | Human / Clockwork, revised run | `hybrid_5.png` |

**Use the raw single generated image**, not the grid containing two versions. The site creates the rotated and 64 px versions interactively and displays both in print.

The file numbering in the original notebook might be different if you ran more experiments. Check the thumbnail before copying. Never relabel an unrelated output as one of the selected results.

For Section 3.2, the HTML attempts to load the three `text_edit_*.png` figures directly from the original Kaggle export folder. If these are absent, it shows a labeled notice, not a fake image. If the run-folder ID is different, edit the `data-paths` attribute of the relevant HTML image tags.

## GitHub Pages deployment

1. Copy the contents into the `flow` Git repository, keeping `index.html` at the root.
2. Commit and push the static HTML, CSS, JavaScript, `assets/`, and the saved output images you wish to feature.
3. On GitHub, open **Settings > Pages > Build and deployment** and choose **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` deploys this static site from the `main` branch.
5. Visit https://sane24.github.io/flow-of-water/ after deployment.

You do not need to commit `.pt` model checkpoints, caches, or very large notebooks with embedded outputs to the website. The original notebooks can be kept locally or linked separately if they are too large.

## Printing and accessibility

Use the **Save as PDF** button in the top navigation, or Chrome's Print dialog. Print layout disables interactive animation, avoids dark full-bleed page backgrounds, expands both anagram orientations, and displays close / far hybrid views together. Set background graphics on if desired for subtle tinting.

All controls are keyboard reachable, there is an Escape-to-close lightbox, and `prefers-reduced-motion` is respected.

## Provenance note

The main figures come from the student's saved notebook output/screenshots. The ocean photo was supplied alongside the project materials. The butterfly, frog and cat vector illustrations, animated water contours and decorative textures are original code-created ornaments. The slider in the Introduction is a **conceptual, simulated forward-process demonstration** and is explicitly labeled as such. Never treat it as a saved model sample.
