# Shot Map and Motion Grammar

Create a shot map before a beat graph becomes a HyperFrames composition. A
beat states what changes in the story; a shot states how the audience sees and
feels that change. Do not use a list of entrances as a substitute for either.

## Required sequence

1. Name the visual thesis and identify the one dominant object for each beat.
2. Pick an original shot family for each beat. Repeating a family is allowed
   only when its meaning changes and the map explains why.
3. Make 3–5 static 9:16 or 16:9 styleframes at the intended hero moments.
4. Run the styleframe review before compiling the motion plan. A project in
   `user-review` mode may not enter `build` until the reviewer records
   `approved`.

## The shot record

Every `production/shot-map.json` entry must contain:

- `beatId` and a unique `id`;
- `family`, `narrativePurpose`, and one `dominantSubject`;
- a concrete `startState`, `mainAction`, and `endState`;
- `cameraPlan`, `materialRule`, and `transitionOut`;
- `durationSeconds`, `actionSeconds`, and `settleSeconds`;
- an optional `audioCues` list that pins an audible event to a named action;
- `styleframeId`, `assetDependencies`, and an `antiPattern` to inspect.

The action must finish before the settle window. A meaningful landing holds for
at least 0.5 seconds; a closing mark or project identity holds for at least
1.0 second. Do not use a hold to compensate for a missing visual event.

## Original families

Use these as semantic motion grammars, not branded templates. Adapt material,
camera, type, and timing to the current project.

| Family | Use it when | The non-negotiable image | Avoid |
| --- | --- | --- | --- |
| `subject-reveal` | The film needs a single hero object | One object receives attention, completes one arc, then settles | A group entrance or a title card with decorative motion |
| `world-build` | Parts need to become a coherent system | Components change from flat/loose to spatial/working | A static grid that merely fades in |
| `decision-impact` | A person, rule, or constraint changes the outcome | The decision visibly changes material state, weight, or layout | A badge, checkbox, or floating label that only appears |
| `relationship-proof` | The story requires technical credibility | A specific link starts on one object and terminates on the other | Unanchored connector lines or explanatory text without proof |
| `artifact-encounter` | A real site, app, file, or output is evidence | The authentic artifact has an intentional camera treatment and remains readable | A tiny decorative screenshot or an unreadable screen recording |
| `assembly-close` | The film needs a memorable final identity | Previously earned elements form one final composition around the identity | A detached end card, bare URL, or repeat of an earlier shot |

## Selection rules

- Give each shot one visual verb. A shot can **assemble**, **lock**, **travel**,
  **prove**, or **resolve**; it cannot lead with all of them.
- Start from the hero frame. The same physical subject, type scale, and
  material rule should explain both the static frame and the later motion.
- Let the product decide the material language. A paper workflow may bend,
  pin, fold, mask, cast a shadow, or press into place. A technical product may
  snap into a coordinate system or travel through a real interface. Do not put
  a generic visual skin over unrelated source evidence.
- Treat the real source artifact as a subject only when it proves something.
  Capture it at sufficient resolution and do not recreate a public page by
  hand. For a third-party source, retain the source-dossier and rights rules.
- Choose a transition because the outgoing state causes the incoming state.
  A foreground object, shared shape, depth travel, focus transfer, or material
  mask may carry the cut. A full-screen wipe is not a default transition.
- Use high-energy shots and reading shots in alternation. Consecutive peaks
  become noise; consecutive explanations become slides.

## Styleframe review

`production/styleframe-review.json` is a creative gate, not a render report.
It records the intended hero frame for each selected shot and the review
outcome. Require all of the following before `status` becomes `approved`:

- every frame has one readable dominant subject;
- every connector, mask, and shadow has a real source/target or material job;
- the selected type, palette, light, and material match `DESIGN.md`;
- the shot sequence has a visible energy curve and no repeated primary family;
- authentic product/source evidence is readable where the storyboard relies on
  it;
- the review notes name any deliberate exception to these rules.

Do not treat a contact sheet from an unfinished animation as a styleframe.
Styleframes are designed hero states first; they are not incidental render
captures.
