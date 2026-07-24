---
name: motion-video-director
description: Create original, editable, code-first motion-design explainer videos with HyperFrames from a topic, script, data, and local assets. Use when the user wants a 10–60 second motion-first explainer, kinetic-type sequence, product/UI story, editorial diagram video, or procedural Canvas/p5 animation that must be deterministic, inspectable, and free of text-to-video or image-to-video providers.
---

# Motion Video Director

Turn a topic, script, data, or local media into a motion-first HyperFrames video. Direct the visual language before composing it. Deliver an editable source project, rendered MP4, and QA evidence.

## Boundaries

- Use HyperFrames as the only rendering runtime.
- Use local images, screen recordings, logos, SVG, Lottie, audio, Canvas/p5, and shaders when they serve the story.
- Do not call text-to-video, image-to-video, first/last-frame, or external video-generation providers.
- Do not promise live-action footage generation, pixel-level reference replication, or arbitrary video genres.
- Do not make a sequence of slide-like title, card, and fade scenes. A video needs continuous visual logic and visible state changes.

## Required project inputs

Collect or infer only decisions that affect the production route:

- topic, script, data, or supplied local assets;
- intended audience, ratio, and duration; default to 16:9 and 30 seconds when safe;
- whether narration or an existing audio file drives timing;
- factual accuracy needs and required source material;
- brand assets or a visual reference.

For factual, current, medical, legal, financial, historical, or named-entity claims, verify the core claims before creating the beat graph.

## Workflow

### 1. Set visual identity

Read the project `DESIGN.md` when it exists. Otherwise, obtain a concise design direction before composition work: mood, light/dark canvas, and any brand colors, fonts, or references. Create `DESIGN.md` with a style prompt, 3–5 palette colors, 1–2 font families, and explicit anti-patterns.

Do not use generic colors or typography as a substitute for a visual identity.

### 2. Write a motion thesis and beat graph

Write one sentence:

`This video moves by showing <visual metaphor> transform from <start state> to <end state>, proving <core claim>.`

Create a beat graph using [references/beat-graph.md](references/beat-graph.md). Every beat needs a narrative job, main moving object, visible state change, camera/layer motion, text role, asset need, and PPT risk. At least 80% of beats must have a visible state change beyond a fade or slide entrance.

If no moving metaphor exists, invent one before building a composition.

### 3. Initialize and complete the project contract

Read [references/project-contract.md](references/project-contract.md). For a deterministic local baseline, run:

```bash
node <skill-root>/scripts/init-production.mjs <empty-project-directory>
```

The generated project is a `starter`, not a completed production. Before changing the composition, replace its brief, design direction, beat graph, asset manifest, and proof plan with the actual project decisions. Promote it to `production` only when it is a 10–60 second user-facing film.

Keep all video-generation policy fields as `prohibited`. List factual claims and their sources before animating them. Record only local assets that are actually used.

After planning inputs are complete, compile the execution plan once:

```bash
node <skill-root>/scripts/compile-motion-plan.mjs <project-dir>
```

The compiled plan is the source of truth for proof times, style-proof targets, approved holds, and review coverage. Resume an interrupted project with `resume-production.mjs`; do not rediscover its state from loose artifacts.

After a source revision from `review` or `complete`, reopen it explicitly before rerunning evidence:

```bash
node <skill-root>/scripts/reopen-production.mjs <project-dir> build "<revision reason>"
```

### 4. Choose local assets and components

Use supplied local assets first. Use generated or imported assets only when explicitly available in the host environment and approved by the user; do not substitute an external video provider.

Select 2–4 motion primitives and reuse them with variation. Read [references/style-profile-contract.md](references/style-profile-contract.md) when choosing a style profile.

For relationship, evidence, decision, or process explainers, read [references/editorial-system.md](references/editorial-system.md) and use `assets/style-packs/editorial-system/example/` as the implementation reference. Replace its design and production decisions; do not reuse its copy as a generic template.

Use Canvas/p5 for procedural interaction, state machines, particles, or hand-drawn systems. Keep its random seed, virtual input path, and audio events deterministic.

### 5. Build with HyperFrames

Use `npx hyperframes init <project-dir> --non-interactive` for a new project whenever the CLI is available. Use `assets/hyperframes-starter/` as the baseline composition and design contract, not as an immutable visual style.

Build the static hero frame before animation. Register a paused GSAP timeline in `window.__timelines`, use `data-*` timing attributes, and let the renderer own playback. Use finite repeats only. Use transitions between multi-scene compositions.

### 6. Validate before rendering

Read [references/quality-gates.md](references/quality-gates.md). Run:

```bash
node <skill-root>/scripts/validate-production.mjs <project-dir> --samples 15
```

This command runs the local contract, HyperFrames lint/validation/inspection, and animation map; it records only actual passing results and rejects any dead zone not represented by an approved hold. To inspect a source change before the full validation pass, run:

```bash
node <skill-root>/scripts/verify-contract.mjs .
```

For a significant new composition, generate and inspect a motion map. Correct lint errors, unintentional overflows, contrast failures, collisions, dead zones, and unapproved low-motion intervals before calling the video complete.

The map runner intentionally loads a project-local HyperFrames producer rather than depending on a host plugin cache:

```bash
npm install --save-dev @hyperframes/producer@0.7.70
node <skill-root>/scripts/animation-map.mjs . --out .hyperframes/animation-map
```

Create a current runtime fingerprint before evidence capture. It covers composition source, declared local assets, project-local dependency locks, and the Skill validation runtime. A changed fingerprint invalidates passed evidence:

```bash
node <skill-root>/scripts/fingerprint-production.mjs <project-dir>
node <skill-root>/scripts/fingerprint-production.mjs <project-dir> --check
```

For a reusable style profile or a high-risk visual mechanism, render the selected proof frames with the project-local HyperFrames CLI. Then generate the review checklist; a scaffold is not a creative approval:

```bash
node <skill-root>/scripts/style-proof.mjs <project-dir>
node <skill-root>/scripts/review-scaffold.mjs <project-dir>
```

### 7. Deliver evidence

Render through the wrapper so the output and media probe bind to the pre-render source fingerprint:

```bash
node <skill-root>/scripts/render-production.mjs <project-dir> \
  --output renders/final.mp4 --quality standard --workers 2
node <skill-root>/scripts/capture-contact-sheet.mjs <project-dir> \
  --video renders/final.mp4 --output renders/contact-sheet.jpg
node <skill-root>/scripts/finalize-production.mjs <project-dir>
```

Deliver the source project, final MP4, contact sheet, selected proof times, style-proof frame set, review scaffold, renderer validation results, and an `ffprobe` media summary. Distinguish successful checks from unverified visual or audio claims. Advance `control.json` to `complete` only after every required delivery check passes.

## Bundled resources

- [references/beat-graph.md](references/beat-graph.md): required scene and beat contract.
- [references/style-profile-contract.md](references/style-profile-contract.md): reusable style profile boundary.
- [references/editorial-system.md](references/editorial-system.md): first concrete profile and usage rules for relationship explainers.
- [references/project-contract.md](references/project-contract.md): project planning, asset, proof, and delivery-report contract.
- [references/quality-gates.md](references/quality-gates.md): source, visual, and delivery gates.
- [assets/hyperframes-starter/](assets/hyperframes-starter/): no-provider starter composition.
- [assets/project-contract/](assets/project-contract/): copyable planning and delivery-report baseline.
- [assets/style-packs/editorial-system/example/](assets/style-packs/editorial-system/example/): complete 12-second HyperFrames reference sample.
- `scripts/bootstrap-project.mjs`: copies the fallback starter into an empty directory.
- `scripts/init-production.mjs`: copies the fallback starter and its production contract into an empty directory.
- `scripts/verify-contract.mjs`: validates the bundled starter or a copied project against the local source contract; it does not replace HyperFrames lint, validation, or visual inspection.
- `scripts/animation-map.mjs`: records timeline tween samples, potential collisions, pacing flags, dead zones, and element lifecycles using the composition's local `@hyperframes/producer` dev dependency.
- `scripts/compile-motion-plan.mjs` and `scripts/resume-production.mjs`: compile planning decisions and resume from the explicit production stage.
- `scripts/reopen-production.mjs`: returns a reviewed or complete production to build/validate and truthfully marks dependent evidence stale.
- `scripts/fingerprint-production.mjs`: writes or checks the source/runtime fingerprint that invalidates stale evidence.
- `scripts/validate-production.mjs`: runs contract and HyperFrames quality gates, records their evidence, and verifies animation-map dead zones against approved holds.
- `scripts/style-proof.mjs`, `scripts/review-scaffold.mjs`, and `scripts/render-production.mjs`: capture style evidence, generate review coverage, and bind a local render to its source fingerprint.
- `scripts/capture-contact-sheet.mjs` and `scripts/finalize-production.mjs`: capture proof-time frames from the fingerprint-bound render and move a fully verified project to complete.
