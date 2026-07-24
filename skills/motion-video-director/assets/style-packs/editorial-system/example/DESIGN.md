# Design

## Style Prompt

Create a warm-paper editorial system in which scattered questions become a
single accountable decision. The frame should feel like a precise publication
spread: an assertive serif statement on the left, a technical relationship map
on the right, quiet structural rules throughout, and rust used only where a
signal becomes active. The diagram is the second focal point and carries the
meaning through connection, registration, and resolution.

## Colors

- `paper` — `#F5F0E6`: reading surface.
- `ink` — `#17312A`: primary text, nodes, and structure.
- `muted` — `#53645C`: supporting labels.
- `rule` — `#B8C5BA`: gutters, routes, and secondary structure.
- `signal` — `#A93F29`: active input and editorial emphasis.
- `proof` — `#3B6B56`: verified path and resolved decision state.

## Typography

Use `Baskerville` for the display statement and `IBM Plex Mono` for labels, evidence,
and metadata. The serif voice makes an editorial claim; the mono voice makes
the evidence accountable. Keep display tracking tight and labels tabular.

## Motion Rules

Reveal the argument in this order: incoming signals, routes, evidence units,
then the decision node. Use a distinct ease for each stage. Build the complete
hero frame in CSS first; all GSAP entrances resolve into those positions. Keep
the final decision visible rather than cutting to a new CTA card.

## What Not To Do

- Do not replace the map with a stack of feature cards.
- Do not introduce extra accent colors or paper-texture decoration.
- Do not center a single headline in empty space.
- Do not use a dashboard grid as background wallpaper.
- Do not treat a fade as a meaningful state change.
