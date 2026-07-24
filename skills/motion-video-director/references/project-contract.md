# Production Project Contract

Use this contract for every project created with `scripts/init-production.mjs`.
It keeps creative decisions, local-asset provenance, proof times, and delivery
evidence beside the editable HyperFrames source. It does not replace the
HyperFrames CLI or its renderer checks.

## Layout

```text
<project>/
  DESIGN.md
  index.html
  project.json
  production/
    brief.json
    beat-graph.json
    asset-manifest.json
    proof-plan.json
    delivery-report.json
```

`project.json` describes the local composition. `production/` describes why it
exists, how it should move, which local assets it may use, and how it must be
proved.

## Project stages

- `starter`: a short, deterministic baseline supplied by this Skill. It may be
  1–60 seconds and is never a finished production claim.
- `production`: a user-facing film. It must be 10–60 seconds and pass every
  required delivery gate before being called complete.

Promote a project to `production` only after replacing the starter brief,
design, beat graph, and source composition with the actual work.

## `brief.json`

Keep the production route in one small, factual file.

Required fields:

- `schemaVersion`: `1`.
- `status`: `starter` or `production`.
- `projectId`, `title`, `audience`, and `motionThesis`.
- `ratio`: `16:9` or `9:16`.
- `durationSeconds` and `fps`, matching `project.json`.
- `narration.mode`: `none`, `local-audio`, or `user-voice`.
- `generationPolicy`: `textToVideo`, `imageToVideo`, and
  `firstLastFrameVideo` must all be `prohibited`.
- `factualClaims`: an array. Keep it empty for original demonstrations; put
  claims and source references here before animating factual material.

Do not put provider credentials, remote media URLs, or unverified claims here.

## `beat-graph.json`

Use 3–8 ordered beats. Each beat must include:

- unique `id`;
- `startSeconds` and `endSeconds` inside the project duration;
- one `narrativeJob` (`hook`, `reveal`, `contrast`, `mechanism`,
  `consequence`, `proof`, or `close`);
- `mainMovingObject`;
- `stateChangeKind` (`transform`, `travel`, `connect`, `split`, `accumulate`,
  `reveal`, `resolve`, or `hold`) and a concrete `stateChange` or intentional
  hold rationale;
- `cameraOrLayerMotion`, `textRole`, `assetNeed`, and `pptRisk`.

At least 80% of beats need a concrete state change. Use `hold` only for the
remaining 20% and explain what the viewer is given time to read or absorb. A
fade, a title entrance, or a card appearing by itself is not a state change.

## `asset-manifest.json`

List only local assets that appear in the edit. Every item needs a unique `id`,
`kind`, `relativePath`, `role`, and `source`. Paths must stay below the project
root and point to a file that exists. Use `assets/` for imported media.

The empty array is valid for a purely HTML/CSS/SVG/Canvas project.

## `proof-plan.json`

Create one entry per beat. Each entry maps its `beatId` to at least three proof
times: early change, hero state, and late/final state. Keep each time inside
that beat. These are the timestamps for visual review and the contact sheet.

## `delivery-report.json`

Start all checks as `not-run`. Record only actual results: `passed`, `failed`,
`not-run`, or `not-applicable`. The required checks are source contract,
HyperFrames lint, validation, inspection, animation map, render, media probe,
and contact sheet.

Never use a `passed` value to mean "expected to pass".

## Local validation

Run the source contract after changing project metadata or planning files:

```bash
node <skill-root>/scripts/verify-contract.mjs <project-dir>
```

For a `production` project, this is only the first gate. Run the actual
HyperFrames lint, validate, inspect, animation-map, render, and media checks
before updating `delivery-report.json`.
