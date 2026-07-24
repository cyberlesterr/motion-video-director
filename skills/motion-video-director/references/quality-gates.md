# Quality Gates

Passing a render command is not proof that the delivered video is good.

## Source gate

- A project `DESIGN.md` exists and names palette, typography, and anti-patterns.
- The motion thesis and beat graph exist before composition code.
- Every beat has a concrete state change and named proof times.
- Local assets have a clear role and path. No external video-generation provider was called.
- `compiled-motion-plan.json` matches the current planning inputs and names the style-proof targets and approved holds.
- `runtime-fingerprint.json` matches the current composition source, local assets, dependency locks, and Skill runtime.

## HyperFrames gate

Run `npx hyperframes check .`, `npx hyperframes lint .`, `npx hyperframes validate .`, and `npx hyperframes inspect . --samples 15`.

- Fix lint errors and unintended track overlaps.
- Fix text overflow, clipping, off-canvas elements, and contrast warnings.
- For significant compositions, install `@hyperframes/producer@0.7.70` as a project dev dependency and run `node <skill-root>/scripts/animation-map.mjs . --out .hyperframes/animation-map`. Inspect its collision, offscreen, invisible, pacing, and dead-zone findings alongside the composition hero frames.
- Mark only genuinely intentional overflow as allowed.
- Treat a dead zone as approved only when it exactly matches a proof-backed `approvedHolds` window; do not call a static tail intentional after the fact.

## Style-proof and review gate

- Run `style-proof.mjs` for the one or two compiled target beats. Inspect the actual captured frames, not a static mockup.
- Run `review-scaffold.mjs` and use its proof-time checklist for creative or vision review. The scaffold itself is a pending checklist, never a creative approval.
- Regenerate both after any runtime fingerprint change.

## Delivery gate

- Render the intended composition and preserve the source project.
- Produce a contact sheet at meaningful proof times.
- Inspect resolution, frame rate, duration, video codec, and audio presence with `ffprobe`.
- Render through `render-production.mjs` so the MP4 and media probe retain the exact pre-render source fingerprint.
- Use `capture-contact-sheet.mjs` so every contact-sheet frame derives from that same rendered MP4 and the authored proof times.
- State exactly which visual, audio, and technical checks passed and which were not run.
