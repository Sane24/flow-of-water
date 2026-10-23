# Content audit

Checklist built from the Fall 2026 Part A and Part B assignment pages, mapped to what the site shows, plus notes on evidence that is missing or that I could not verify from the saved files.

## Part A deliverables

| Section | Requirement | On the site |
| --- | --- | --- |
| 1.1 | `interpolate`; own image (not the Campanile) plus t = 0.25, 0.50, 0.75 | Fig. A1, nighthouse.png |
| 1.2 | Noisy input and best Gaussian blur at all three times | Fig. A2 (σ = 16, 4, 1 chosen by the notebook's MSE sweep) |
| 1.3 | `one_step_denoise`; original, noisy, estimate at all three times | Fig. A3 |
| 1.4 | Original once; noisy, predicted update, true update, RMS error map per time | Figs. A4 to A7, unmodified notebook plots |
| 1.5 | `euler_sample`; trajectory from t = 0.5 (start, every fifth update, final); comparison with blur and one-step | Figs. A8, A9, logged MSE values |
| 1.6 | Five samples from noise, "a high quality photo" | Fig. A10, seeds 180 to 184 |
| 2.1 | `cfg_velocity`; five CFG samples (w = 7) from the same noises, compared | Fig. A11 |
| 3.1 | Campanile + two own images at seven starting times; one web image + two drawings at seven starting times | Figs. A12 to A17 (drawings: Malfoy, using the cropped `malfoy-c.png` run, and Keroppi); extras A18, A19 (Jeanne, two crops) |
| 3.2 | Campanile + two own images with own prompts, seven starting times, prompts shown | Figs. A20 to A22, exact prompt strings from the notebook |
| 3.3 | `visual_anagrams`; two illusions, upright and rotated, both prompts | Four illusions (Figs. A23 to A26) |
| 3.4 | `make_hybrids`; two hybrids at full and reduced size, both prompts | Six (Figs. A27 to A32), each with the 512 × 512 and 64 × 64 views |

## Part B deliverables

| Section | Requirement | On the site |
| --- | --- | --- |
| 1.1 | UNet implementation | Explanation and original architecture diagram (Fig. B1) |
| 1.2 | Noising visualization for σ = 0.0 to 1.0 | Fig. B2 |
| 1.2.1 | Loss curve; test results after epochs 1 and 5 | Figs. B3, B4 and per-epoch loss table |
| 1.2.2 | OOD results for the same image across σ | Fig. B5 and MSE table |
| 1.2.3 | Pure-noise loss curve; results after epochs 1 and 5; explanation | Figs. B6, B7 and discussion |
| 2.1 | Time-conditioned UNet | Explanation and Fig. B8 |
| 2.2 | Training loss curve | Fig. B9 and per-epoch table |
| 2.3 | Samples after epochs 1, 5, 10 | Figs. B10, B11 |
| 2.4 | Class conditioning with one-hot vectors and 10% dropout | Explanation |
| 2.5 | Training loss curve | Fig. B12 and per-epoch table |
| 2.6 | Four of each digit after epochs 1, 5, 10; no-scheduler run with explanation | Figs. B13 to B17 and tables |

## Evidence notes

- **Class-conditioned loss curves.** `class_fm_scheduled_training_loss.png` and `class_fm_no_scheduler_training_loss.png` were saved to Google Drive in the notebook but are not in the local folder. Both curves on the site (Figs. B12, B15) are extracted from the saved outputs of notebook cells 47 and 48, so they are the original plots.
- **No-scheduler samples.** Only the epoch-10 samples were generated for the constant learning rate run. Its epoch 1 and 5 checkpoints exist but were never sampled. The site says so.
- **Why 2e-3.** The notebook records the constant learning rate (2e-3) but not the reasoning behind it. The explanation on the site (between the scheduled run's start and end values, close to its epoch-8 rate) is a reconstruction and should be checked by the author.
- **Revised clockwork hybrid.** The second run changed both prompts and the seed (190 instead of 182), so the comparison is not controlled. The site states this.
- **Volcano and wine anagram.** Run in its own cell with seed 190 (SEED + 10).
- **Night house editing output.** In notebook cell 27 the displayed figure for `my_image_1` is missing from the saved outputs, but `edit_my_image_1.png` exists in the run folder and is displayed by cell 28.
- **Null condition in `edit`.** `edit` calls `cfg_velocity` without passing the encoded `null_condition`, so the unconditional branch receives the default empty string `''` rather than `model.encode("")`. The cell ran without errors, so the provided `predict_velocity` presumably accepts a raw string, but I could not confirm that from the saved files. Anagrams and hybrids pass the encoded null condition explicitly.
- **Runs left off the site.** The first Malfoy edit (`edit_drawing_1.png`, uncropped `malfoy.png`) and the eye/moonlit sky and hourglass/beach anagrams (`anagram_3`, `anagram_4`) were run but are not shown, by choice.
- **Unused inputs.** `blackcat.jpeg`, `blackcat2.jpg`, `oceanbeach.jpg`, `oceanwave.jpg` and `hourglass.jpg` were uploaded to the Kaggle dataset but no notebook cell loads them (anagrams and hybrids are generated from text only). They are not shown on the site.
- **Observations.** Descriptions of what each figure shows were written from looking at the saved images. Numbers (losses, MSE, parameter counts, learning rates) are copied from notebook output.
- **Author line.** The site credits "Sampurn Bhowmick", taken from the local git configuration and the Kaggle dataset path.
- **Bells and Whistles.** Not attempted (required only for CS280A).
