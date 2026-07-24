---
name: motion-video-director
description: Direct an original, editable, code-first HyperFrames video from a topic, script, data, local assets, public website, or GitHub project. Use a source dossier and factual claim links only when the story needs a public source. Use when the user wants a product promo, product analysis, GitHub/open-source project share, kinetic-type sequence, editorial diagram video, or procedural Canvas/p5 animation that must be inspectable and free of text-to-video or image-to-video providers.
---

# Motion Video Director

Turn a public website, GitHub project, topic, script, data, or local media into a motion-first HyperFrames video. Capture and bound the source before making claims; direct an original visual language before composing it. Deliver an editable source project, rendered MP4, and QA evidence.

## Boundaries

- Use HyperFrames as the only rendering runtime.
- Use local images, screen recordings, logos, SVG, Lottie, audio, Canvas/p5, and shaders when they serve the story.
- Do not call text-to-video, image-to-video, first/last-frame, or external video-generation providers.
- Do not promise live-action footage generation, pixel-level website replication, or arbitrary video genres.
- Do not make a sequence of slide-like title, card, and fade scenes. A video needs continuous visual logic and visible state changes.
- Treat public website copy as `source-claimed`, not independent verification. Do not access a login, private page, or user session.
- A website capture is evidence and visual reference, not permission to reuse its photos, video, logo, copy, or UI wholesale. Record selected local assets separately with their rights basis.

## Required project inputs

Collect or infer only decisions that affect the production route:

- a public credential-free website URL, a GitHub repository URL, or topic/script/data/supplied local assets;
- intended audience, ratio, and duration; default to 16:9 and 30 seconds when safe;
- whether narration or an existing audio file drives timing;
- factual accuracy needs and required source material;
- brand assets or a visual reference.

For factual, current, medical, legal, financial, historical, or named-entity claims, link each claim to a captured source fact before creating the beat graph. Marketing claims from a website must remain explicitly source-claimed unless the user supplies or approves independent verification.

## Workflow

### 1. Choose a source route and capture it

Read [references/source-dossier.md](references/source-dossier.md) and [references/project-contract.md](references/project-contract.md). Initialize an empty project first:

```bash
node <skill-root>/scripts/init-production.mjs <empty-project-directory>
```

For a public website or GitHub project, capture it during the `plan` stage:

```bash
node <skill-root>/scripts/capture-source.mjs <project-dir> \
  --type website --url <https-url> --usage commentary

node <skill-root>/scripts/capture-source.mjs <project-dir> \
  --type github --url https://github.com/<owner>/<repo> --usage commentary
```

The website route invokes HyperFrames capture and preserves its public-page artifacts. The GitHub route snapshots public repository metadata, the exact default-branch commit, README when available, and the public page unless `--skip-page-capture` is intentional. The command refuses to overwrite a prior capture. Use `authorized-promotion` only when the user has confirmed authority to make promotional material; otherwise use `commentary`.

For a wholly original/local production, keep the initialized `local-brief` dossier in its `not-captured` state. Never place secrets, credentials, private URLs, or remote media URLs in the dossier.

### 2. Propose the editorial thesis, then obtain the creative gate

Inspect `production/source-dossier.json` and state what is verified, source-claimed, or unknown. Propose the target audience, one-sentence source thesis, 3–6 factual claims with their fact IDs (or no factual claims), duration/ratio, tone, script, and storyboard.

For a third-party website or GitHub project, stop for explicit user approval of that package before composing or rendering the video. A capture, planning contract, review scaffold, or passing technical check is never creative or rights approval.

### 3. Set visual identity

Read the project `DESIGN.md` when it exists. Otherwise, obtain a concise design direction before composition work: mood, light/dark canvas, and any brand colors, fonts, or references. Create `DESIGN.md` with a style prompt, 3–5 palette colors, 1–2 font families, and explicit anti-patterns.

Do not use generic colors or typography as a substitute for a visual identity.

### 4. Gate composition with a shot map and styleframe review

Read [references/shot-map.md](references/shot-map.md). Before writing a
composition, map every beat to one named shot family, one dominant subject,
one action arc, and one exit/transition cause. Make 3–5 designed static
styleframes at the actual hero states; do not reuse incidental animation
captures or a generic moodboard.

Record the entries in `production/shot-map.json` and the review package in
`production/styleframe-review.json`. A `user-review` project may not compile
from `plan` to `build` until the user has reviewed and approved the package.
Use `autonomous` only when the user has explicitly delegated that creative
decision. Treat styleframes as a low-cost creative gate: correct visual
direction, material language, hierarchy, and source-evidence treatment before
writing scene code.

### 5. Write a motion thesis and beat graph

Write one sentence:

`This video moves by showing <visual metaphor> transform from <start state> to <end state>, proving <core claim>.`

Create a beat graph using [references/beat-graph.md](references/beat-graph.md). Every beat needs a narrative job, main moving object, visible state change, camera/layer motion, text role, asset need, and PPT risk. At least 80% of beats must have a visible state change beyond a fade or slide entrance.

If no moving metaphor exists, invent one before building a composition.

### 6. Complete the project contract

The generated project is a `starter`, not a completed production. Before changing the composition, replace its brief, source dossier, design direction, shot map, styleframe review, beat graph, asset manifest, and proof plan with the actual project decisions. Promote it to `production` only when it is a 10–60 second user-facing film.

Keep all video-generation policy fields as `prohibited`. Every factual claim needs an `id`, `claim`, and one or more `sourceFactIds` present in the source dossier. Record only local assets that are actually used.

After planning inputs are complete, compile the execution plan once:

```bash
node <skill-root>/scripts/compile-motion-plan.mjs <project-dir>
```

The compiled plan is the source of truth for proof times, style-proof targets, approved holds, and review coverage. Resume an interrupted project with `resume-production.mjs`; do not rediscover its state from loose artifacts.

After a source revision from `review` or `complete`, reopen it explicitly before rerunning evidence:

```bash
node <skill-root>/scripts/reopen-production.mjs <project-dir> build "<revision reason>"
```

### 7. Choose local assets and components

Use supplied local assets first. Use generated or imported assets only when explicitly available in the host environment and approved by the user; do not substitute an external video provider.

Select 2–4 motion primitives and reuse them with variation. Derive an original visual system from the story, not from a fixed in-repository style pack or a pixel-level imitation of the source website. Reuse a shot family only when the shot map names a new narrative reason; never repeat it merely because it is easy to implement.

Use Canvas/p5 for procedural interaction, state machines, particles, or hand-drawn systems. Keep its random seed, virtual input path, and audio events deterministic.

### 8. Build with HyperFrames

Use `npx hyperframes init <project-dir> --non-interactive` for a new project whenever the CLI is available. Use `assets/hyperframes-starter/` as the baseline composition and design contract, not as an immutable visual style.

Build the static hero frame before animation. Register a paused GSAP timeline in `window.__timelines`, use `data-*` timing attributes, and let the renderer own playback. Use finite repeats only. Use transitions between multi-scene compositions.

### 9. Validate before rendering

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

For a high-risk visual mechanism, render the selected proof frames with the project-local HyperFrames CLI. Then generate the review checklist; a scaffold is not a creative approval:

```bash
node <skill-root>/scripts/style-proof.mjs <project-dir>
node <skill-root>/scripts/review-scaffold.mjs <project-dir>
```

### 10. Deliver evidence

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
- [references/shot-map.md](references/shot-map.md): required pre-composition shot grammar and styleframe gate.
- [references/source-dossier.md](references/source-dossier.md): public-source capture, fact, rights, and creative-gate contract.
- [references/project-contract.md](references/project-contract.md): project planning, asset, proof, and delivery-report contract.
- [references/quality-gates.md](references/quality-gates.md): source, visual, and delivery gates.
- [assets/hyperframes-starter/](assets/hyperframes-starter/): no-provider starter composition.
- [assets/project-contract/](assets/project-contract/): copyable planning and delivery-report baseline.
- `scripts/bootstrap-project.mjs`: copies the fallback starter into an empty directory.
- `scripts/init-production.mjs`: copies the fallback starter and its production contract into an empty directory.
- `scripts/capture-source.mjs`: captures one public website or GitHub project into a hash-bound source dossier before creative planning.
- `scripts/verify-contract.mjs`: validates the bundled starter or a copied project against the local source contract; it does not replace HyperFrames lint, validation, or visual inspection.
- `scripts/animation-map.mjs`: records timeline tween samples, potential collisions, pacing flags, dead zones, and element lifecycles using the composition's local `@hyperframes/producer` dev dependency.
- `scripts/compile-motion-plan.mjs` and `scripts/resume-production.mjs`: compile planning decisions and resume from the explicit production stage.
- `scripts/reopen-production.mjs`: returns a reviewed or complete production to build/validate and truthfully marks dependent evidence stale.
- `scripts/fingerprint-production.mjs`: writes or checks the source/runtime fingerprint that invalidates stale evidence.
- `scripts/validate-production.mjs`: runs contract and HyperFrames quality gates, records their evidence, and verifies animation-map dead zones against approved holds.
- `scripts/style-proof.mjs`, `scripts/review-scaffold.mjs`, and `scripts/render-production.mjs`: capture style evidence, generate review coverage, and bind a local render to its source fingerprint.
- `scripts/capture-contact-sheet.mjs` and `scripts/finalize-production.mjs`: capture proof-time frames from the fingerprint-bound render and move a fully verified project to complete.
