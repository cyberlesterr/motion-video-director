# Design System

## Overview

This is a 27-second, 9:16 Chinese promotional explainer for `paper-collage-video`. It should feel like a small paper atelier coming alive, not a GitHub walkthrough and not a generic AI launch trailer. The recurring visual event is **physical alignment**: loose scraps gather, paper tabs lock, approval stamps land, and depth layers find their intended relationship.

The source screenshot appears once, as a small provenance tile in the final beat. It is supporting evidence, never the composition's visual language.

## Style Prompt

Tactile editorial paper motion: warm fibrous stock, midnight-blue ink, vermilion approval stamps, saffron construction paper, and a soft leaf-green counterweight. Treat the screen as a working paper desk. Shapes have torn or tabbed silhouettes, offset ink shadows, and real overlap. Motion should land like paper being placed by a deliberate hand: quick approach, small overshoot, then a quiet settle.

## Colors

- `paper`: `#F7EEDB` — the warm stock beneath every beat.
- `ink`: `#1F2A44` — the primary editorial ink and night field.
- `vermilion`: `#D84B39` — approvals, decisive verbs, and the human-director mark.
- `saffron`: `#F2B441` — craft energy and the working system.
- `leaf`: `#638C71` — calm technical proof and depth layers.
- `pulp`: `#D9C7A8` — paper edges, lines, and restrained texture.

No full-screen gradient is used. The background uses flat paper color with subtle dotted pulp texture and a sparse ink shadow.

## Typography

- Display Chinese: `ZCOOL XiaoWei` — a paper-friendly Chinese display face whose slightly printed character contrasts with the technical labels.
- System labels and code-like details: `IBM Plex Mono`, `ui-monospace`, monospace.
- Avoid dense paragraphs. The primary sentence stays at 2–3 lines, with labels acting as a quiet second voice.

## Elevation

There are only three depth levels:

1. **Desk** — paper field and faint pulp grain.
2. **Working pieces** — cards, scraps, stamps, and landscape layers, with a 10–18px offset ink shadow.
3. **Proof marks** — thin ink rings, thread lines, and short labels; these sit above the pieces but never become UI chrome.

## Components

- **Torn scrap:** irregular clip-path, one color, small ink shadow, used only as a moving physical fragment.
- **Tabbed production card:** large paper panel with a protruding label tab; cards mechanically interlock instead of appearing as dashboard widgets.
- **Approval stamp:** a rough circular border with one concise human decision. Three stamps form the visual spine of the middle beat.
- **Composition tree:** three nested labels that contract into the physical boat scene, so the proof line has named endpoints.
- **Source tile:** a small, clipped paper window around the captured README screenshot in the close.

## Do's and Don'ts

Do:

- Make every line start at the element it explains or connects.
- Use overlap, tabs, masks, and paper shadows to create depth rather than decorative parallax.
- Keep the human approvals visibly larger and warmer than the automation labels.
- Let the final URL arrive as part of an assembled object, not as a separate end card.

Don't:

- Copy GitHub's interface, palette, spacing, or layout.
- Use stock paper textures, supplied repository art, AI-generated images, video generation, or first/last-frame generation.
- Use a card grid, neon gradient, generic floating particles, or a long static hold.
- Claim an unattended pipeline: the design must keep the human decision points in the foreground.

## What Not To Do

- Do not make it look like a presentation that cross-fades between five slides.
- Do not draw dangling connector lines; every connector must terminate on a specific card, stamp, or scene layer.
- Do not let type cover the boat, character, or approval marks at their hero moments.
- Do not make the source screenshot large enough to become an unreadable screen recording.
