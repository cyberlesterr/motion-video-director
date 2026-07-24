# Motion Video Director

`motion-video-director` is a code-first HyperFrames skill for turning a topic, script, data, and local assets into an editable motion-design explainer video.

It is deliberately not a text-to-video or image-to-video wrapper. It directs an original, deterministic production process: visual metaphor, beat graph, HyperFrames composition, local media, and evidence-based delivery QA.

## Scope

- 10–60 second 16:9 or 9:16 motion explainers.
- HTML, CSS, GSAP, SVG, Canvas/p5, optional shaders, local images, screen recordings, logos, Lottie, and local audio.
- Kinetic type, editorial diagrams, product/UI stories, and procedural visual metaphors.
- Deterministic rendering and local quality checks.

## Non-goals

- Text-to-video, image-to-video, first/last-frame interpolation, or other external video-generation providers.
- Live-action footage generation or a generic "make any kind of video" promise.
- A default slide-deck flow made from titles, cards, and fades.

## Core contract

Every production starts with a visual metaphor and a beat graph. A beat has a narrative job, a main moving object, and a visible state change; simple entrances or exits alone do not count as a state change. At least 80% of beats must visibly transform, travel, connect, split, accumulate, reveal, or otherwise change state.

The skill requires a project-specific `DESIGN.md` before composition work and treats the final MP4 as incomplete until its renderer checks, key frames, and media probe are recorded.

## Repository layout

```text
skills/motion-video-director/
  SKILL.md                         # Agent workflow and production boundaries
  agents/openai.yaml               # Codex interface metadata
  assets/hyperframes-starter/      # Copyable no-provider starter composition
  assets/project-contract/         # Copyable brief, beat, asset, proof, and delivery records
  assets/style-packs/              # Reusable visual systems with real HyperFrames samples
  references/                      # Beat, style, and QA contracts
  scripts/                         # Bootstrap and static contract checks
```

## Local development

Install the bundled skill into Codex while developing:

```bash
cp -R skills/motion-video-director ~/.codex/skills/
```

For a new HyperFrames project, prefer the official CLI:

```bash
npx hyperframes init my-motion-video --non-interactive
```

Then use the bundled starter composition as the design and composition baseline. If the CLI is unavailable in a constrained environment, use the bundled fallback template:

```bash
node skills/motion-video-director/scripts/bootstrap-project.mjs ./my-motion-video
```

The fallback does not replace the official HyperFrames scaffold; it gives a deterministic source template that can be linted and rendered once the CLI is available.

For a contract-managed local starter, initialize the composition and its production artifacts together:

```bash
node skills/motion-video-director/scripts/init-production.mjs ./my-motion-video
node skills/motion-video-director/scripts/verify-contract.mjs ./my-motion-video
node skills/motion-video-director/scripts/compile-motion-plan.mjs ./my-motion-video
node skills/motion-video-director/scripts/resume-production.mjs ./my-motion-video
```

This creates a short `starter` project. Replace its brief, design, beat graph,
asset manifest, and proof plan before promoting a user-facing video to
`production`; production projects must be 10–60 seconds.

## Included style pack

`editorial-system` is the first complete profile: warm-paper editorial
hierarchy, diagrammatic relationships, and restrained signal color for stories
about evidence, processes, and decisions. Its self-contained 12-second
reference project is at
[`skills/motion-video-director/assets/style-packs/editorial-system/example/`](skills/motion-video-director/assets/style-packs/editorial-system/example/).

Run its pinned HyperFrames checks from that directory:

```bash
npm install
npm run compile-plan
npm run validate
npm run style-proof
npm run review-scaffold
npm run render
```

## Validation

```bash
python3 /Users/lester/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/motion-video-director
node skills/motion-video-director/scripts/verify-contract.mjs \
  skills/motion-video-director/assets/hyperframes-starter
```

For a real project, run the HyperFrames checks before delivery:

```bash
npx hyperframes check .
npx hyperframes lint .
npx hyperframes validate .
npx hyperframes inspect . --samples 15
```

For a significant composition, install the pinned producer locally and record
the motion diagnostics without relying on a host-level plugin cache:

```bash
npm install --save-dev @hyperframes/producer@0.7.70
node skills/motion-video-director/scripts/animation-map.mjs . --out .hyperframes/animation-map
```

For a contract-managed production, compile planning first and bind every proof
to the current source/runtime fingerprint. The render wrapper records the
pre-render digest alongside the MP4 and `ffprobe` result:

```bash
node skills/motion-video-director/scripts/compile-motion-plan.mjs .
node skills/motion-video-director/scripts/validate-production.mjs . --samples 15
node skills/motion-video-director/scripts/style-proof.mjs .
node skills/motion-video-director/scripts/review-scaffold.mjs .
node skills/motion-video-director/scripts/render-production.mjs . \
  --output renders/final.mp4 --quality standard --workers 2
node skills/motion-video-director/scripts/capture-contact-sheet.mjs . \
  --video renders/final.mp4 --output renders/contact-sheet.jpg
node skills/motion-video-director/scripts/finalize-production.mjs .
```

## License and publication

This repository is licensed under the [MIT License](LICENSE) and is published at [cyberlesterr/motion-video-director](https://github.com/cyberlesterr/motion-video-director).
