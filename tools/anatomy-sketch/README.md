# Anatomy sketch — pipeline prototype

Hands-on trial of the pipeline in [`docs/anatomy-sketches.md`](../../docs/anatomy-sketches.md), run on 14 Oct 2026. Nothing here is production code; it proves each stage with real tools.

## What was tried

| Stage | How | Result |
|---|---|---|
| 1 Plan | Prompt "labelled skeleton of a domestic dog, side view" → `spec.json` (spec + species checklist) | Fine. The spec drives a deterministic drawing prompt; the user's words never reach the image model. |
| 4 Draw | Spec-built prompt to an image model (Canva's generator was the only one with credit; ElevenLabs and a second Canva call were refused for quota) | One candidate, 1456×1088, a credible veterinary-plate dog skeleton with no text. Only a 199 px thumbnail could be pulled into the container. |
| 5 Verify | Checklist in `spec.json` applied by a vision model | Passed at thumbnail resolution: four limbs, digitigrade hock and carpus, no clavicle bar, scapula flat on the thorax, zygomatic arch, no text, white ground. Rib, vertebra and digit counts need the full-resolution image. |
| 6 Label | Vision model gives normalised anchors (`anchors.json`); `trace_and_label.py` lays out the text in two columns with leader lines | Works. Labels are real SVG `<text>`, so nothing is garbled. Two leader lines cross (lumbar/pelvis); the greedy layout needs a fan-out rule. |
| 7 Vectorize | OpenCV adaptive threshold → vtracer (binary, spline) → `<g id="drawing">` | Works. The sample traced from the 5× upscaled thumbnail is heavy; at native resolution the hatching comes through as fine paths. A global threshold dropped the grey hatching; adaptive thresholding fixed it. |

See `sample/dog_skeleton_labelled.svg` (open in any browser or Inkscape) and `sample/dog_skeleton_labelled.png`.

## Run it

```bash
pip install vtracer opencv-python-headless numpy cairosvg
python3 trace_and_label.py <drawing.png> anchors.json out.svg
python3 -c "import cairosvg; cairosvg.svg2png(url='out.svg', write_to='out.png', output_width=1600)"
```

## Next

- Put `OPENAI_API_KEY` in the cloud environment's settings (Network secrets or an environment variable). A new session picks it up; then stage 4 can use the OpenAI image API directly at full resolution and the verify → edit → retry loop can be exercised.
- Replace the hand-placed anchors with a vision-model call that returns `anchors.json` from the drawing and the structure list.
- Leader-line layout: assign sides by anchor x, then order by y, and forbid crossings.
