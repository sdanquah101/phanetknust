# Anatomical sketches from prompts — architecture

Goal: a web app and a public API that turn a prompt such as *"lateral view of the skeleton of a domestic dog, labelled"* or *"muscles of a horse's forelimb, pencil sketch"* into accurate, high-fidelity anatomical sketches of any animal, delivered as PNG and as editable SVG with real text labels.

This document is the plan. Nothing in it is built yet.

## 1. Why "ask the model for SVG" fails, and what to do instead

Asking a language model to write `<path d="…">` produces blobs because a language model has no spatial model of a horse. It knows the *names* of the bones and roughly where they go in words, but it cannot place a curve. Three things fix this, and the whole design follows from them:

1. **The LLM never authors geometry.** It plans, names, checks and labels. Drawing is done by image models that have visual priors, and by geometry we compute ourselves.
2. **Every drawing is grounded in a reference.** Real anatomical plates (public domain, see §5) are retrieved for the species, system and view, and fed to the image model as reference images. Proportions come from the plate, not from the prompt.
3. **Nothing ships unverified.** A vision model grades each candidate against a species-specific anatomical checklist (digit count, rib count, clavicle present or absent, hoof vs paw…) and the pipeline retries or edits until it passes. Labels are drawn by us as SVG text, never rendered inside the image, so they can't be garbled.

Vectors come last: the raster line drawing is traced to SVG paths and the label layer is composed on top. The result is a real vector sketch that scales and opens in Illustrator or Inkscape, without ever asking a text model to draw.

## 2. The pipeline

```
prompt ──► 1 Plan ──► 2 Retrieve refs ──► 3 (Guide) ──► 4 Draw ──► 5 Verify ──┐
                                                             ▲                 │ fail: edit & retry (≤3)
                                                             └─────────────────┘
                                                                 pass ──► 6 Label ──► 7 Vectorize ──► 8 Deliver
```

| # | Stage | Who does it | Output |
|---|---|---|---|
| 1 | **Plan** — turn the prompt into a strict `SketchSpec` | LLM with structured output, validated against the species registry | JSON: species, system, region, view, pose, style, labels, format |
| 2 | **Retrieve references** — find 2–4 plates for that species/system/view; fall back to the nearest taxon (zebra → horse, jackal → dog) | pgvector similarity + metadata filters | reference image URLs + "adapt from horse" notes |
| 3 | **Structural guide** (phase 3, optional) — render a 3D parametric animal in the requested pose and view, extract edges/depth | SMAL model + Blender/pyrender | edge map used as ControlNet conditioning |
| 4 | **Draw** — generate the line drawing, *no text, no background, no labels* | Image model with reference-image input (backend-pluggable, §4) | 2048 px raster, or native SVG from a vector backend |
| 5 | **Verify** — grade the candidate against the species checklist; produce a targeted edit instruction on failure | Vision LLM | per-check pass/fail, severity, score, edit prompt |
| 6 | **Label** — locate each requested structure; place leader lines and text without collisions | Vision LLM (phase 3: Grounding DINO + SAM for pixel-exact anchors) + our layout code | label layer as SVG `<g id="labels">` |
| 7 | **Vectorize** — trace the line drawing to paths; clean, simplify, group | vtracer / potrace, OpenCV preprocessing | `<g id="drawing">` |
| 8 | **Deliver** — write PNG, SVG, labelled SVG, and a manifest | Supabase Storage + `sketches` row | signed/public URLs, manifest JSON |

Every stage writes a `sketch_events` row (stage, duration, cost, model, input hash, output ref) so any bad result can be replayed stage by stage.

### 2.1 Plan: the `SketchSpec`

```ts
type SketchSpec = {
  species: { id: string; common: string; scientific: string; class: "mammal"|"bird"|"reptile"|"amphibian"|"fish"|"arthropod"|"other"; nearestReference?: string };
  system: "external" | "skeletal" | "muscular" | "organs" | "nervous" | "vascular";
  region: "whole" | "head" | "forelimb" | "hindlimb" | "trunk" | "wing" | "tail" | string;
  view: "lateral-left" | "lateral-right" | "dorsal" | "ventral" | "anterior" | "posterior" | "three-quarter";
  pose: "standing-neutral" | "walking" | "flying" | "perched" | "swimming" | string;
  style: "plate-engraving" | "pencil" | "clean-line" | "ink-wash";
  labels: "none" | "auto" | string[];         // structure names, resolved to ontology ids
  output: { png: boolean; svg: boolean; width: number };
};
```

The planner is given the species registry and the structure ontology as tools, so "femur of a chicken" resolves to a known species row and a known structure id, and "the long bone in the thigh of a bird" resolves to the same thing. Unknown species are rejected with a suggestion, not guessed.

### 2.2 Draw: the prompt is built from the spec, not from the user's words

A deterministic template per style, e.g.

> Scientific anatomical illustration of the **skeletal system** of a **domestic dog (Canis familiaris)**, **left lateral view**, **standing neutral pose**, pen-and-ink engraving in the manner of a veterinary anatomy plate, fine cross-hatching, pure white background, the whole animal centred and filling the frame, **no text, no labels, no numbers, no arrows, no background**. Match the proportions and bone placement of the reference images exactly.

Reference plates go in as image inputs. Each backend has a `negative`/"avoid" channel where supported (text, labels, colour, extra limbs).

### 2.3 Verify: the species checklist

The registry stores a checklist per species per system. Example, dog / skeletal:

```json
[
  {"id":"digits_fore","check":"five digits on each forelimb, dewclaw small and raised","severity":"block"},
  {"id":"digits_hind","check":"four weight-bearing digits on each hindlimb","severity":"block"},
  {"id":"clavicle","check":"no clavicle (dogs have a vestigial one, must not be drawn as a bar)","severity":"block"},
  {"id":"ribs","check":"13 pairs of ribs","severity":"warn"},
  {"id":"stance","check":"digitigrade: stands on the toes, heel (calcaneus) well off the ground","severity":"block"},
  {"id":"vertebrae","check":"7 cervical, 13 thoracic, 7 lumbar, 3 fused sacral, tail vertebrae present","severity":"warn"},
  {"id":"skull","check":"skull in profile shows zygomatic arch, orbit open caudally, carnassial dentition","severity":"warn"}
]
```

The critic returns `{checkId, pass, confidence, note}` for each, plus one edit instruction for the worst blocker ("redraw the hind feet: the heel must be raised, dogs are digitigrade"). On a blocking failure the pipeline runs an **edit**, not a fresh generation: the same image goes back with the instruction so the parts that passed stay put. After three attempts the best-scoring candidate ships, flagged `needs_review`, and the failing checks are shown to the user.

Vision models are imperfect counters, so the critic is a filter, not an oracle. The "report an error" button on every result feeds `feedback`, and feedback is the eval set for the next model switch (§7).

### 2.4 Label: our text, our lines

The labeller gets the final drawing and the resolved structure list and returns normalised anchor points `{structureId, x, y, confidence}`. We then:

1. drop anchors below a confidence threshold (the UI says "could not locate: patella");
2. run a greedy side-assignment (left column / right column / top / bottom) sorted by anchor y, then nudge to avoid overlap;
3. draw leader lines with a small dot at the anchor, labels in the design system's type, as real `<text>`.

A second, cheap vision pass checks the composed image ("does the line for *scapula* end on the scapula?") and moves anchors that fail. Phase 3 replaces the vision-LLM anchor with an open-vocabulary detector + segmenter (Grounding DINO + SAM) so the anchor is the centroid of a mask, which is pixel-exact and species-independent.

### 2.5 Vectorize

Raster → SVG with [vtracer](https://github.com/visioncortex/vtracer) (colour/greyscale, Rust, Python and Node bindings) or potrace for pure 1-bit. Preprocess with OpenCV: greyscale, adaptive threshold, despeckle, optional thinning, then trace with `mode=polygon|spline`, `filter_speckle≈4`, `corner_threshold≈60`. Group paths under `<g id="drawing">`, labels under `<g id="labels">`, and add `viewBox` so the file scales cleanly. If the draw backend emitted native SVG (Recraft vector), skip tracing and just add the label group.

## 3. System architecture

Two sizes. Both share the same code and interfaces; the difference is where the pipeline runs.

### Simple (ship first): serverless, TypeScript only

```
apps/anatomy (Next.js 15, Netlify)
 ├─ UI: prompt → refine form (pre-filled by the planner) → progress → result viewer → downloads
 ├─ /api/v1/sketches  (public REST, API keys)
 └─ netlify/functions/run-sketch-background.ts  (Netlify background function, up to 15 min)
            └─ runs stages 1,2,4,5,6,8 by calling provider APIs
Supabase: Postgres (sketches, jobs, registry, feedback) · Storage (outputs, reference corpus) · Realtime (progress)
Image backend: Recraft V4.1 Vector (native SVG) and/or a raster editor (GPT Image 2 / Gemini 3.1 Flash Image / FLUX 2 Pro Edit)
```

No servers to run. Vectorization is done by choosing a backend that outputs SVG natively; if a raster backend wins the benchmark, tracing waits for the worker below.

### Complex (phase 2+): add a Python worker

```
services/sketch-worker (Python 3.12, FastAPI health + job loop, Docker; Fly.io / Railway / Cloud Run)
 ├─ picks jobs from Postgres with `for update skip locked` (or pgmq)
 ├─ stages 1–8 with OpenCV, vtracer, pgvector retrieval
 └─ phase 3: SMAL rendering (pyrender/Blender), ControlNet on fal.ai/Replicate, Grounding DINO + SAM
```

The worker is where anything with native dependencies lives. Netlify functions and Supabase Edge Functions can't host OpenCV or Blender. The repo already uses Python and Playwright for `tools/program-ads`, so a Python worker is in keeping.

### Backend interfaces (so providers are swappable)

```ts
interface Renderer {               // stage 4
  id: string;                      // "recraft-v4.1-vector" | "gpt-image-2" | "gemini-3.1-flash-image" | "flux-2-pro-edit" | "flux-controlnet"
  generate(p: { prompt: string; negative?: string; references: Buffer[]; guide?: Buffer; width: number; seed?: number }): Promise<{ png?: Buffer; svg?: string; cost: number }>;
  edit(p: { image: Buffer; instruction: string; mask?: Buffer }): Promise<{ png: Buffer; cost: number }>;
}
interface Critic   { grade(image: Buffer, checklist: Check[]): Promise<CheckResult[]> }           // stage 5
interface Labeller { locate(image: Buffer, structures: Structure[]): Promise<Anchor[]> }          // stage 6
interface Tracer   { trace(png: Buffer, opts: TraceOpts): Promise<string> }                        // stage 7
```

`Critic` and `Labeller` are Claude with vision in both tiers. `Renderer` is chosen per request by a `renderer` field (default from config), so A/B tests are a query parameter.

### Data model (Supabase)

```sql
species            (id, common_name, scientific_name, class, order_, family, nearest_reference_species_id,
                    checklists jsonb,            -- {skeletal:[…], muscular:[…], external:[…]}
                    aliases text[])
structures         (id, uberon_id, name, synonyms text[], systems text[], applies_to_classes text[])
reference_plates   (id, storage_path, species_id, system, view, region, source, license, year,
                    embedding vector(768))       -- pgvector, multimodal embedding of the plate
sketches           (id, user_id, api_key_id, prompt, spec jsonb, renderer, status,   -- queued|planning|drawing|verifying|labelling|vectorizing|done|failed|needs_review
                    attempts int, score numeric, checks jsonb, outputs jsonb,        -- {png, svg, labelled_svg, manifest}
                    cost_usd numeric, created_at, finished_at)
sketch_events      (id, sketch_id, stage, model, duration_ms, cost_usd, input_hash, output_ref, note, created_at)
sketch_jobs        (sketch_id, run_after, locked_by, locked_at, attempts)            -- the queue
api_keys           (id, user_id, key_hash, label, monthly_quota, created_at, revoked_at)
feedback           (id, sketch_id, user_id, kind, structure_id, note, created_at)   -- kind: wrong_anatomy|wrong_label|style|other
```

RLS: users see their own sketches; `species`, `structures` are public read; `reference_plates` are private (served through signed URLs to the worker only). Admin app gets a page to curate species checklists and plates.

### API contract

```
POST /api/v1/sketches
  { "prompt": "labelled skeleton of a domestic cat, lateral view",
    "options": { "style": "plate-engraving", "labels": "auto", "format": ["png","svg"], "renderer": "default" } }
→ 202 { "id": "sk_…", "status": "queued" }

GET  /api/v1/sketches/:id
→ 200 { "status": "done", "spec": {...}, "score": 0.92,
        "checks": [ {"id":"digits_fore","pass":true}, … ],
        "outputs": { "png": "https://…", "svg": "https://…", "labelled_svg": "https://…", "manifest": "https://…" } }

GET  /api/v1/species            → registry (for autocomplete)
GET  /api/v1/species/:id/structures?system=skeletal
POST /api/v1/sketches/:id/feedback
```

Progress reaches the web UI over Supabase Realtime on the `sketches` row. API clients poll or register a `webhook_url` on create.

## 4. Choosing the drawing model (benchmark before committing)

Candidates, as of October 2026:

| Backend | Output | Reference images | Why it's on the list | Watch out for |
|---|---|---|---|---|
| **Recraft V4.1 Vector / Pro Vector** | native SVG | yes | The only major family that emits real vector paths; line-weight and palette control; ~13–15 s | Anatomical fidelity unproven; licence terms on free tier (images belong to Recraft); verify pricing (~$0.035, Pro ~$0.21) |
| **GPT Image 2** | raster | yes (edit endpoint) | Top of current editing rankings; strong instruction following for the edit-and-retry loop | Cost per image; occasional text leakage |
| **Gemini 3.1 Flash Image** | raster | yes | Fast and cheap; good with multiple references | Style drift between retries |
| **FLUX.2 Pro Edit / FLUX.1 Kontext** | raster | yes | Precise local edits with several references; good value | Weaker on rare species |
| **Open weights: FLUX/SDXL + ControlNet + custom LoRA** (fal.ai / Replicate) | raster | via ControlNet + IP-Adapter | Full control: structural guides from SMAL, a LoRA trained on the plate corpus for a consistent "plate" style | Needs the worker and a GPU bill; phase 3 |

The benchmark (phase 0) is a script in `tools/anatomy-bench/`: 24 fixed prompts (6 species × skeletal/muscular/external × 2 views, covering a quadruped, a bird, a fish, a reptile, a frog and an insect), 2 seeds, every backend. It records cost, latency, the critic's score, and two human ratings (anatomy 1–5, drawing quality 1–5). Pick the best score-per-dollar; keep the second as a fallback. Expect quadruped mammals to score well everywhere and arthropods and fish to separate the backends.

## 5. The reference corpus (the accuracy lever)

Public-domain veterinary and artistic anatomy plates, catalogued by species, system, view, region:

- **Ellenberger, Baum & Dittrich, *Handbuch der Anatomie der Tiere für Künstler* (1898–1925)** — horse, cow, dog, lion, goat, deer; muscles, skeleton and surface form in standard views. Digitised and public domain at the [University of Wisconsin–Madison](https://search.library.wisc.edu/digital/AVetAnatImgs); a 1898 volume under Public Domain Mark at [TU Wien](https://repositum.tuwien.at/handle/20.500.12708/225804). This is exactly the "anatomy for artists" style the product wants.
- **Sisson, *The Anatomy of the Domestic Animals* (1914)** — horse, ox, sheep, pig, dog; every system, line engravings. Public domain, on the Internet Archive.
- **Biodiversity Heritage Library** — skeletons of birds, fish, reptiles and invertebrates from 19th-century monographs (CC0 / public domain marks per item).
- **Wikimedia Commons** categories *Animal skeletons*, *Comparative anatomy* for gaps (check each file's licence).

Ingest: `tools/anatomy-corpus/ingest.py` crops plates, writes metadata (species, system, view, source, licence), computes a multimodal embedding, and uploads to the `anatomy-refs` bucket + `reference_plates`. Target: ~300 plates covering ~40 species at phase 2, growing with demand. The same corpus trains the phase-3 LoRA, which is why its licensing must be clean from day one.

## 6. Species registry and structure ontology

- **Species**: seed ~40 (domestic mammals, big cats, primates, rodents, bats, marine mammals, 6 birds, 4 reptiles, 2 amphibians, 4 fish, 3 arthropods). Each has a `nearest_reference_species_id` so a request for an unseen species degrades gracefully ("drawn by adapting horse references; verify independently" in the manifest).
- **Checklists**: first drafted by an LLM from the species' known anatomy, then **reviewed by a person who knows the animal** before they count as `block`-severity. KNUST has a School of Veterinary Medicine; a student reviewer pass over 40 checklists is a weekend's work and is what makes the critic trustworthy.
- **Structures**: names map to [UBERON](https://obophenotype.github.io/uberon/) ids so "humerus" is the same structure in a dog, a pigeon and a frog, labels are consistent across species, and synonyms (common, Latin, local) resolve to one id.

## 7. Quality, cost and operations

- **Anatomy score** on every sketch = weighted pass rate over checks (block ×3, warn ×1). Shown as a badge; `< 0.8` is `needs_review`.
- **Eval set** = the phase-0 benchmark prompts + every `feedback` row marked `wrong_anatomy`. Re-run it on every renderer or prompt-template change; the CI job fails if the mean score drops.
- **Cost per sketch** (estimate): plan $0.01 · draw $0.04–0.20 × 1–3 attempts · verify $0.02 × attempts · label $0.03 · tracing free. Roughly **$0.10–0.60** and **30–90 s**. Per-user and per-key quotas in `api_keys`; an admin page shows spend by day and by renderer.
- **Caching**: identical `SketchSpec` + renderer + seed → return the existing sketch. Reference retrievals are cached by spec hash.
- **Provenance**: the manifest lists the renderer, seed, references used (with licence), checks and attempts, so a result can be audited and reproduced.
- **Secrets**: `ANTHROPIC_API_KEY`, `RECRAFT_API_KEY`, `OPENAI_API_KEY` / `GOOGLE_API_KEY` / `FAL_KEY` (whichever the benchmark picks) added to `turbo.json` `globalEnv` and `.env.example`; worker gets `SUPABASE_SECRET_KEY`.

## 8. Phases

| Phase | Scope | Result |
|---|---|---|
| **0 · Benchmark** (1 week) | `tools/anatomy-bench`, 3 backends, 24 prompts, human rating sheet | Chosen renderer and fallback, with numbers |
| **1 · Simple tier** (2–3 weeks) | `apps/anatomy` UI + API, Netlify background function, planner, chosen renderer, critic loop, label layer, Supabase tables, species registry (20 species, checklists LLM-drafted), downloads | Working product; raster + labelled SVG (native SVG if Recraft wins, else labels over an embedded PNG) |
| **2 · Grounding** (3 weeks) | Reference corpus + pgvector retrieval, Python worker, OpenCV + vtracer tracing, reviewed checklists for 40 species, admin curation pages, feedback loop, eval CI | Noticeably more accurate proportions; true vector output from any renderer |
| **3 · Structure** (4–6 weeks, research-flavoured) | SMAL-rendered structural guides + ControlNet for quadrupeds (check the Max Planck licence first; it is not OSI open source), LoRA fine-tuned on the corpus for plate style, Grounding DINO + SAM anchors for labels | Exact view and pose control; pixel-exact labels; consistent house style |
| **4 · Editing & layers** | Masked regional edits ("redo the hind foot"), registered layers (skin → muscle → skeleton generated in sequence, each conditioned on the previous one's edge map) so a student can toggle layers on one pose | The "interactive anatomy plate" |

## 9. Risks and how the design absorbs them

- **Rare species draw badly.** Nearest-taxon references + the manifest's "adapted from" note + `needs_review` flag. Coverage grows by adding plates, not code.
- **Internal organs are harder than skeletons.** Phase 1 ships external + skeletal + muscular; organs and vascular come with corpus coverage in phase 2.
- **Vision critics miscount.** Critic is a filter with retries, plus human feedback into the eval set; phase 3 adds detector-based counting for digits and limbs.
- **Model churn.** Everything behind `Renderer`/`Critic`/`Labeller`; switching is a config change and a benchmark run.
- **Licensing.** Corpus is public domain only; SMAL is non-commercial by default; check each provider's terms on ownership of outputs before a paid launch.
- **Long jobs on serverless.** Background functions give 15 minutes; the worker tier removes the limit entirely.

## 10. Decisions needed before phase 0

1. **Audience and style default**: veterinary/biology students (labelled, plate style) or artists (surface form, pencil)? Both are supported; it sets the default and the first 20 species.
2. **Where it lives**: its own subdomain (`anatomy.phaneteers.com` or a new domain) as `apps/anatomy`, or inside the Academy. The design assumes a separate app with its own public API.
3. **Monthly image budget** for the benchmark and first month (a few hundred generations ≈ US$20–60).
4. **Start simple or complex**: recommendation is the simple tier first, with the interfaces above so the worker slots in without rewriting the app.

## Sources

- Recraft V4 / V4.1 vector models: [overview](https://invideo.io/blog/recraft-ai-image-generator/), [V4.1 Vector on OpenRouter](https://openrouter.ai/recraft/recraft-v4.1-vector), [V4.1 Pro Vector](https://openrouter.ai/recraft/recraft-v4.1-pro-vector), [API guide](https://apiframe.ai/guides/recraft-api-guide)
- Image-editing model landscape: [alternatives ranking](https://modelgrep.com/media/alternatives/fal-ai/flux-pro/kontext), [FLUX Kontext pro](https://atlascloud.ai/it/models/black-forest-labs/flux-kontext-pro), [Gemini image models (Nano Banana) as partner models](https://helpx.adobe.com/sg/firefly/web/generate-images-with-text-to-image/generate-images-using-text-prompts/generate-images-using-non-adobe-models.html)
- SMAL animal shape model: [project page](https://smal.is.tue.mpg.de/), [paper](https://arxiv.org/pdf/1611.07700), [licence](https://is.mpg.de/ps/code/smal), [SMALify](https://github.com/benjiebob/SMALify)
- Ellenberger plates: [UW–Madison digital collection](https://search.library.wisc.edu/digital/AVetAnatImgs), [TU Wien 1898 volume (Public Domain Mark)](https://repositum.tuwien.at/handle/20.500.12708/225804), [Brown University guide](https://libguides.brown.edu/WebResources/Animals)
