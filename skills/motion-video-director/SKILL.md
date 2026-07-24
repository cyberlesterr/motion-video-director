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

### 3. Choose local assets and components

Use supplied local assets first. Use generated or imported assets only when explicitly available in the host environment and approved by the user; do not substitute an external video provider.

Select 2–4 motion primitives and reuse them with variation. Read [references/style-profile-contract.md](references/style-profile-contract.md) when choosing a style profile.

Use Canvas/p5 for procedural interaction, state machines, particles, or hand-drawn systems. Keep its random seed, virtual input path, and audio events deterministic.

### 4. Build with HyperFrames

Use `npx hyperframes init <project-dir> --non-interactive` for a new project whenever the CLI is available. Use `assets/hyperframes-starter/` as the baseline composition and design contract, not as an immutable visual style.

Build the static hero frame before animation. Register a paused GSAP timeline in `window.__timelines`, use `data-*` timing attributes, and let the renderer own playback. Use finite repeats only. Use transitions between multi-scene compositions.

### 5. Validate before rendering

Read [references/quality-gates.md](references/quality-gates.md). Run:

```bash
npx hyperframes lint .
npx hyperframes validate .
npx hyperframes inspect . --samples 15
```

For a significant new composition, generate and inspect a motion map. Correct lint errors, unintentional overflows, contrast failures, collisions, dead zones, and unapproved low-motion intervals before calling the video complete.

### 6. Deliver evidence

Deliver the source project, final MP4, contact sheet, selected proof times, renderer validation results, and an `ffprobe` media summary. Distinguish successful checks from unverified visual or audio claims.

## Bundled resources

- [references/beat-graph.md](references/beat-graph.md): required scene and beat contract.
- [references/style-profile-contract.md](references/style-profile-contract.md): reusable style profile boundary.
- [references/quality-gates.md](references/quality-gates.md): source, visual, and delivery gates.
- [assets/hyperframes-starter/](assets/hyperframes-starter/): no-provider starter composition.
- `scripts/bootstrap-project.mjs`: copies the fallback starter into an empty directory.
- `scripts/verify-contract.mjs`: validates the bundled starter or a copied project against the local source contract; it does not replace HyperFrames lint, validation, or visual inspection.
