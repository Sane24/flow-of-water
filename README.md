# Flow of Water

**Exploring Flow Matching, Image Generation, and Visual Perception**
CS180 Project 3 · UC Berkeley · Fall 2026

Live site: **https://sane24.github.io/flow-of-water/**

A single-page report for both halves of the project:

- **Part A, Exploring the Power of Flow Models.** Noisy training inputs, Gaussian blur vs. one-step vs. Euler denoising, velocity visualizations, sampling from noise, classifier-free guidance, image-to-image and text-guided editing, visual anagrams and hybrid images with PixNerd-XXL-P16-T2I.
- **Part B, Flow Matching from Scratch.** A UNet on MNIST: one-step denoising, out-of-distribution noise, pure-noise denoising, time-conditioned and class-conditioned flow matching, and a learning-rate scheduler ablation.

## Development

Requires Node 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173/flow-of-water/
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
```

## Export the PDF

The page has a dedicated print stylesheet (US Letter). Either use the **Print / Save as PDF** button on the site, or render it headlessly with your installed Google Chrome:

```bash
npm run build
npm run pdf        # writes exports/flow-of-water.pdf
```

In print, every edit sweep is a compact row of eight tiles, every anagram shows both orientations, and every hybrid shows the full-resolution and 64 × 64 views. Nothing depends on clicks or hover.

## Deployment

`.github/workflows/deploy.yml` builds the site and publishes `dist/` to GitHub Pages on every push to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions** once. Vite is configured with `base: '/flow-of-water/'` so every asset resolves under the project subpath.

## Project layout

```
notebooks/                 cleaned copies of the Part A and Part B notebooks
public/images/part-a/      web copies of Part A results (training, denoising, velocity,
                           sampling, editing, text-editing, anagrams, hybrids, full figures)
public/images/part-b/      Part B plots and sample grids
public/images/decorative/  public-domain engravings, toned to the site palette
scripts/build_assets.py    copies, crops and optimizes figures from the raw notebook outputs
scripts/export-pdf.mjs     headless PDF export
src/data/manifest.json     one entry per image: path, section, parameters, kind, source file
src/content/               the report text
src/components/            figures, edit timelines, anagram rotation, hybrid near/far viewer
src/styles/                tokens, layout, components, print
CONTENT_AUDIT.md           deliverable checklist and evidence notes
```

`scripts/build_assets.py` reads the original outputs (the `CS180_PartA_Site_Images/` run folder and the Part B PNGs at the repository root), which are kept locally and not committed. The original files are never modified; the site only uses copies.

## Credits

All result images come from my own notebook runs. Decorative engravings are public domain: Ernst Haeckel, *Kunstformen der Natur* (1904), plates 58 and 68, and Katsushika Hokusai, *The Great Wave off Kanagawa* (c. 1831), via Wikimedia Commons. The line drawings, diagrams and water animations are original. Fonts: Fraunces, Instrument Sans, IBM Plex Mono and Caveat (SIL Open Font License).
