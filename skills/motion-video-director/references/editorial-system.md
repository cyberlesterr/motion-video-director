# Editorial System Profile

Use `editorial-system` for explainers about relationships, evidence, decisions,
processes, and structured data. It turns a set of signals into a legible system;
it is not a slide theme.

## Style prompt

Build an editorial field on warm paper: disciplined rules, generous margins,
serif statements, monospaced evidence, and one restrained rust signal color.
The system should feel designed by an attentive editor who is making a complex
argument readable. Let relationships move; leave ornament subordinate to proof.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| `paper` | `#F5F0E6` | warm reading surface |
| `ink` | `#17312A` | primary argument and structure |
| `muted` | `#53645C` | supporting labels |
| `rule` | `#B8C5BA` | structural rules and quiet routes |
| `signal` | `#A93F29` | one active question or decision cue |
| `proof` | `#3B6B56` | verified connection or resolved state |

Use `Baskerville` for the single expressive statement voice and `IBM Plex Mono` for
evidence, metadata, and numerical labels. The tension is editorial judgement
against accountable systems. Declare the local display face in source and use
the compiler-supported mono family by name so the renderer can embed it rather
than silently substitute a system font. Do not add a second display typeface.

## Motion primitives

1. **Signal arrival** — labels or objects enter from an edge with an
   `expo.out` or `back.out` ease. Use this for unresolved inputs.
2. **Rule draw** — a hairline or SVG route grows from its origin with
   `power3.inOut`. Use it to make a relationship explicit.
3. **Evidence registration** — small proof units settle onto the route with
   short, asymmetric scale/opacity entrances. Use it when a claim gains a
   source or category.
4. **Decision resolve** — one larger node gains emphasis only after its inputs
   are visible. Use a slower `circ.out` or `elastic.out` sparingly.

## Composition rules

- Use at least three layers: paper/field, editorial statement, and active
  system diagram.
- Make two focal points explicit: the claim and the changing relationship map.
- Anchor content to edges and use rules, gutters, and panels to direct the eye.
- Use a continuous system in a single composition when the argument is one
  causal chain. For multiple scenes, carry an existing rule, node, or label
  across a real transition rather than restarting the layout.
- Keep copy short enough to be read before the next state change. Labels should
  name evidence, not paraphrase paragraphs.

## Anti-patterns

- Colored cards arranged in a grid with no relationship motion.
- Newspaper nostalgia, fake paper tears, distressed texture, or decorative
  red circles with no narrative role.
- A persistent dashboard, chart wallpaper, or arrows that point at nothing.
- Multiple accent colors competing to signal importance.
- A separate end-card that abandons the system built by the video.

## Asset rules

Prefer live HTML text, CSS rules, and inline SVG routes. Treat supplied local
charts or documents as evidence: crop them deliberately, cite their role in
`asset-manifest.json`, and animate the relationship around them. Do not use
stock footage or generated video as filler.

## Reference implementation

Start from
[`assets/style-packs/editorial-system/example/`](../assets/style-packs/editorial-system/example/)
when the story has a claim, several inputs, and one resolved outcome. Replace
its design and production files rather than copying its copy verbatim.
