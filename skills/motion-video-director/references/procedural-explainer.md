# Procedural Explainer Profile

Use `procedural-explainer` when the story is about a system becoming
legible: noisy signals gaining a shared rule, individual paths becoming a
route, or feedback turning a fragile process into a stable one. It is a
continuous visual argument, not a technical slide theme.

## Style prompt

Build a dark instrument field with an almost-black green ground, compact
monospaced labels, luminous mint routes, and one warm amber constraint. Start
with a scattered set of signals and let the visible rule do the explanatory
work: align the field, pass the route through a gate, then close a feedback
loop around the resolved state. The effect should feel like a precise
simulation being made readable in real time, not like futuristic decoration.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| `void` | `#061417` | deep field and outer frame |
| `panel` | `#0C2429` | system plane and quiet surfaces |
| `grid` | `#234148` | structural coordinates and inactive routes |
| `signal` | `#75F6C4` | active paths and resolved feedback |
| `constraint` | `#FFC66D` | the rule that selects and aligns |
| `alert` | `#FC7B72` | noisy inputs before they become legible |
| `paper` | `#E6F5EC` | primary type and final state label |

Use `IBM Plex Mono` as a deliberate single-family system: heavy, tightly
tracked uppercase statements are the instrument label; lighter, tabular labels
are the operational readout. The single family reinforces the premise that the
claim and evidence belong to the same system. Keep copy short, use at least
20px body labels, and reserve the warm constraint color for the actual rule.

## Motion primitives

1. **Signal scatter** — authored, deterministic offsets reveal from distinct
   directions. Use this to establish that inputs are not yet organized.
2. **Constraint snap** — several signals move into an ordered lane with a
   deliberate `inOut` ease. The changed geometry, not a caption, proves that
   a rule is active.
3. **Route pulse** — a small active unit travels along a declared path, fast
   enough to read as flow and slow enough to trace.
4. **Feedback closure** — a final loop draws only after the output exists,
   making the resolved system visibly self-correcting rather than merely
   highlighted.

## Composition rules

- Use a persistent left instrument panel and a larger right system field; both
  must carry information throughout the film.
- Use at least three layers: field/grid, signal geometry, and operational
  labels or counters.
- Keep the constraint physically between inputs and output. Never let it
  become an arbitrary badge.
- Build one continuous composition when the story is one causal sequence.
  Existing geometry should remain on screen while the next state arrives.
- Give the final state a short reading hold while the completed route and
  feedback loop remain visible.

## Anti-patterns

- Neon grid wallpaper, fake terminal text, binary rain, or a persistent
  sci-fi HUD with no narrative role.
- A collection of floating metric cards or a slide-by-slide feature tour.
- Randomness that changes between renders, or particle motion that does not
  represent a described state change.
- A final logo/CTA screen that discards the route built by the composition.
- Amber, mint, and coral all competing as unqualified decoration.

## Asset rules

Prefer live HTML, CSS geometry, inline SVG routes, and explicitly authored
signal coordinates. Local data, UI captures, or charts may enter only if they
play the role of a signal, constraint, or proof in the route. Do not use stock
footage or generated video as atmospheric filler.

## Reference implementation

Start from
[`assets/style-packs/procedural-explainer/example/`](../assets/style-packs/procedural-explainer/example/)
when an abstract process needs a concrete visual model. Replace its story copy,
signal labels, and proof plan rather than treating it as a generic technology
theme.
