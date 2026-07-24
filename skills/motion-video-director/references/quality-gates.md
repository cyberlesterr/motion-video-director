# Quality Gates

Passing a render command is not proof that the delivered video is good.

## Source gate

- A project `DESIGN.md` exists and names palette, typography, and anti-patterns.
- The motion thesis and beat graph exist before composition code.
- Every beat has a concrete state change and named proof times.
- Local assets have a clear role and path. No external video-generation provider was called.

## HyperFrames gate

Run `npx hyperframes lint .`, `npx hyperframes validate .`, and `npx hyperframes inspect . --samples 15`.

- Fix lint errors and unintended track overlaps.
- Fix text overflow, clipping, off-canvas elements, and contrast warnings.
- For significant compositions, install `@hyperframes/producer@0.7.70` as a project dev dependency and run `node <skill-root>/scripts/animation-map.mjs . --out .hyperframes/animation-map`. Inspect its collision, offscreen, invisible, pacing, and dead-zone findings alongside the composition hero frames.
- Mark only genuinely intentional overflow as allowed.

## Delivery gate

- Render the intended composition and preserve the source project.
- Produce a contact sheet at meaningful proof times.
- Inspect resolution, frame rate, duration, video codec, and audio presence with `ffprobe`.
- State exactly which visual, audio, and technical checks passed and which were not run.
