# Style Profile Contract

A style profile is a reusable visual system, not a one-off collection of colors.

## Required profile fields

- `name`: a stable, hyphenated identifier.
- `stylePrompt`: one paragraph describing the visual world and intended emotional effect.
- `palette`: 3–5 named colors with explicit roles.
- `typography`: one display and one supporting face, or an explicit single-family rule.
- `motionPrimitives`: 2–4 reusable motions with a reason for each.
- `transitionLanguage`: how scenes hand off without jump cuts.
- `antiPatterns`: what would make the film generic, visually noisy, or slide-like.
- `assetRules`: which local assets may appear and how they are treated.

## Initial profile families

- **[editorial-system](editorial-system.md)**: diagrammatic relationships, warm-paper editorial hierarchy, restrained rust accent, and moving structure over decorative cards. Includes a complete HyperFrames sample.
- **dark-product**: deep spatial canvas, large UI hero objects, localized glow, CTA-driven transformations, no persistent neon grid.
- **procedural-poetry**: Canvas/p5 systems, seeded behavior, sparse typography, audio events derived from the same state changes as the image.

Use a profile as a starting point. Create a project `DESIGN.md` for the actual video; do not copy a profile blindly.
