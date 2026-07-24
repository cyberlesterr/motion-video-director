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
    source-dossier.json
    shot-map.json
    styleframe-review.json
    beat-graph.json
    asset-manifest.json
    proof-plan.json
    control.json
    compiled-motion-plan.json
    runtime-fingerprint.json
    style-proof.json
    review-scaffold.json
    delivery-report.json
```

`project.json` describes the local composition. `production/` describes why it
exists, how it should move, which local assets it may use, where a resumed run
continues, and how it must be proved. The compiled plan and evidence records are
machine-generated; agents update them through the bundled scripts rather than
editing them by hand.

When a project starts from a public website or GitHub repository, its raw
capture files live below `capture/`. `source-dossier.json` binds them to the
project by relative path, byte count, and SHA-256 digest. It is planning input,
not a license or a claim that the captured source is independently true.

## Project stages

- `starter`: a short, deterministic baseline supplied by this Skill. It may be
  1–60 seconds and is never a finished production claim.
- `production`: a user-facing film. It must be 10–60 seconds and pass every
  required delivery gate before being called complete.

Promote a project to `production` only after replacing the starter brief,
design, shot map, styleframe review, beat graph, and source composition with
the actual work.

## `control.json`

`control.json` is the short resume source of truth. Its stages advance only in
order: `plan` → `build` → `validate` → `review` → `complete`. It records a
small event history, never a full conversation transcript.

Use these commands rather than inferring the next step from file timestamps:

```bash
node <skill-root>/scripts/resume-production.mjs <project-dir>
node <skill-root>/scripts/set-production-stage.mjs <project-dir> <next-stage> "<reason>"
```

`compile-motion-plan.mjs` automatically advances `plan` to `build` after it
writes a valid compiled plan. For the current contract version, the
styleframe-review creative gate must be approved before compilation. `complete`
is valid only when the delivery report is fully passed.

If a composition, planning input, local asset, dependency lock, or Skill runtime
changes after review, run `reopen-production.mjs <project-dir> build "<reason>"`
or reopen directly at `validate` when the source build itself is unchanged. The
script marks dependent evidence `stale`; it never silently preserves `passed`.

## `brief.json`

Keep the production route in one small, factual file.

Required fields:

- `schemaVersion`: `2` for new projects. Version `1` is accepted only for
  existing projects created before the shot-map gate.
- `status`: `starter` or `production`.
- `projectId`, `title`, `audience`, and `motionThesis`.
- `ratio`: `16:9` or `9:16`.
- `durationSeconds` and `fps`, matching `project.json`.
- `sourceRoute`: `local-brief`, `website`, or `github`, matching
  `source-dossier.json`.
- `narration.mode`: `none`, `local-audio`, or `user-voice`.
- `generationPolicy`: `textToVideo`, `imageToVideo`, and
  `firstLastFrameVideo` must all be `prohibited`.
- `factualClaims`: an array. Keep it empty for original demonstrations. Each
  factual entry needs a unique `id`, `claim`, and one or more `sourceFactIds`
  from `source-dossier.json` before animating the material.

Do not put provider credentials, remote media URLs, or unverified claims here.

## `shot-map.json`

Version-2 projects use a shot map before any composition code. It has one
entry for every beat, maps that beat to a unique `id` and an original motion
family, and makes the visual grammar executable rather than implicit.

Every entry must name a `beatId`, `family`, `narrativePurpose`,
`dominantSubject`, `startState`, `mainAction`, `endState`, `cameraPlan`,
`materialRule`, `transitionOut`, `styleframeId`, and `antiPattern`. It also
declares `durationSeconds`, `actionSeconds`, and `settleSeconds`; action plus
settle must fit within the shot duration. Keep a meaningful settle of at least
0.5 seconds. `audioCues` and `assetDependencies` are arrays, even if empty.

Read [shot-map.md](shot-map.md) before choosing a family. The map is a
creative contract, not an implementation wish list.

## `styleframe-review.json`

Version-2 projects require 3–5 static hero frames before implementation. Each
styleframe points to a local PNG (or a starter SVG placeholder), names one or more mapped shots, and records
the hero moment and review checks. `decisionMode` is `user-review` or
`autonomous`:

- In `user-review`, only the user may turn `status` from `pending` to
  `approved` and add a concise approval record.
- In `autonomous`, use `approved` only when the user explicitly delegated the
  creative decision; record that delegation in the approval note.

The validator accepts a coherent `pending` package while the control stage is
`plan`, so it can be shared for review. It refuses to compile that package into
build work until approved. Never pass incidental video frames off as
styleframes.

## `source-dossier.json`

The initialized local baseline uses `status: "not-captured"`,
`source.route: "local-brief"`, and `usage: "original"`. Do not change it when
the work is based wholly on user-supplied local material.

For public-source work, use `capture-source.mjs` before writing the video
script. It changes the route to `website` or `github`, stores a canonical HTTPS
URL and capture timestamp, then lists every raw artifact beneath `capture/`
with its SHA-256 digest. The contract validates those digests on every
fingerprint-bound proof.

Every fact has a unique id, statement, artifact `sourcePath`, locator, and one
of these verification labels:

- `source-claimed`: text visible on the captured public site; it is not an
  independent fact check.
- `github-api-snapshot`: metadata or README snapshot obtained from GitHub’s
  public API at the captured default-branch commit.
- `user-supplied`: a user-provided source preserved as a local capture artifact.

`source.usage` must be `commentary` or `authorized-promotion` for a captured
source. Do not select the latter unless the user has confirmed the authority to
make promotional material. A dossier establishes provenance, not permission to
reuse branding, imagery, code, or copy; only selected, permitted local assets
go in `asset-manifest.json`.

Before building or rendering a third-party source video, get explicit approval
for the source thesis, factual claims, script, storyboard, duration/ratio, and
tone. The approval is a human production gate, separate from source capture or
technical validation.

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

Also declare:

- `styleProof.targetBeatIds`: one or two high-risk beats whose rendered frames
  prove the reusable visual language;
- `styleProof.rationale`: why those beats are representative;
- `approvedHolds`: an array, empty when there are none. Each hold needs an id,
  beat id, start/end, proof time, and rationale. It must stay within one beat
  and last no more than 2.5 seconds. A hold is reading or observation time, not
  duration padding.

Run `compile-motion-plan.mjs` after changing any planning input. It creates
`compiled-motion-plan.json`, the deterministic execution view of the beats,
proofs, style-proof targets, review checks, and approved holds.

## Fingerprint and proof records

`fingerprint-production.mjs` writes `runtime-fingerprint.json`. The digest
includes the composition source, planning inputs, captured raw source
artifacts, declared local assets, project-local package locks, and the Skill's
validation/runtime scripts. A
source or runtime change invalidates all evidence tied to an older digest.

`style-proof.mjs` captures actual HyperFrames proof frames for the compiled
style targets and records `style-proof.json`. `review-scaffold.mjs` turns the
compiled plan into a pending visual-review checklist; it does not claim that a
human or vision reviewer has approved the result.

`render-production.mjs` records the current pre-render fingerprint, output
artifact hash, and `ffprobe` result. `capture-contact-sheet.mjs` extracts the
named proof times from that fingerprint-bound MP4. Finally,
`finalize-production.mjs` verifies every required check and advances the
control stage from `review` to `complete`.

## `delivery-report.json`

Start all checks as `not-run`. Record only actual per-check results: `passed`,
`failed`, `not-run`, `stale`, or `not-applicable`. `stale` means a planning,
source, asset, dependency, or Skill-runtime change invalidated earlier evidence.
The top-level report status may also
be `in-progress` or `partial`; use `partial` when at least one required gate is
not run, and do not call that result fully verified. The required checks are
source contract (including the source dossier when one is captured), compiled
motion plan, source fingerprint, HyperFrames lint,
validation, inspection, animation map, render, media probe, contact sheet,
style proof, and review scaffold. A report with `status: "passed"` requires
every required check to be `passed` and every fingerprint-bound proof to match
the current runtime fingerprint.

Never use a `passed` value to mean "expected to pass".

## Local validation

Run the source contract after changing project metadata or planning files:

```bash
node <skill-root>/scripts/verify-contract.mjs <project-dir>
```

For a `production` project, this is only the first gate. Compile the motion
plan, write the fingerprint, run actual HyperFrames lint, validate, inspect,
animation-map, style proof, review scaffold, render, and media checks before
updating `delivery-report.json` or advancing `control.json` to complete.
