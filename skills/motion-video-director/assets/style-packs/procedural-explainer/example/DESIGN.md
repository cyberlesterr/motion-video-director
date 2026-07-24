# Design

## Style Prompt

Create a dark procedural instrument in which scattered signals become one
stable, readable route. A compact left panel names each changing state; the
larger right field proves it with real geometry. Mint is reserved for active
flow, amber names the visible rule that aligns the inputs, and coral marks only
unresolved noise. The system must remain in frame as it changes: scatter,
constraint, route, then feedback closure. It should feel precise and physical,
not like a generic terminal, neon grid, or stack of feature cards.

## Colors

- `void` — `#061417`: outer frame and deepest field.
- `panel` — `#0C2429`: system plane and quiet surfaces.
- `grid` — `#234148`: structural coordinates and inactive routes.
- `signal` — `#75F6C4`: active paths and resolved feedback.
- `constraint` — `#FFC66D`: the rule that selects and aligns.
- `alert` — `#FC7B72`: noisy input before it is organized.
- `paper` — `#E6F5EC`: primary type and the final state label.

## Typography

Use `IBM Plex Mono` as an explicit single-family rule. The large statement is
heavy, tight, and uppercase; labels are lighter, tabular, and widely spaced.
The consistent mechanical voice says that the narration and the system belong
to the same instrument. Keep reading copy short and never introduce a second
display face.

## Motion Rules

Build the final stable field in CSS first, then use a paused GSAP timeline to
show how it gets there. Signals reveal at authored offsets, then snap into
ordered lanes when the constraint appears. Route pulses travel only after a
path exists. The feedback loop closes after the output label arrives, leaving a
one-second readable final state. Use different eases and timings for scatter,
alignment, flow, and closure.

## What Not To Do

- Do not turn the four beats into titled slides or metric cards.
- Do not add random or looping particle behavior.
- Do not use a decorative neon grid, fake code, or binary rain.
- Do not let amber, mint, and coral compete without a concrete system role.
- Do not cut away from the completed route for an end card.
