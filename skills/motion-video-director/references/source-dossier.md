# Source Dossier Contract

Use this workflow when the input is a public website or public GitHub
repository. It deliberately separates what was observed, what is claimed by the
source, what may be used as a local asset, and what the eventual video says.

## Capture

Initialize an empty project, then capture exactly one public source during the
`plan` stage:

```bash
node <skill-root>/scripts/init-production.mjs <project-dir>

node <skill-root>/scripts/capture-source.mjs <project-dir> \
  --type website --url https://example.com --usage commentary

node <skill-root>/scripts/capture-source.mjs <project-dir> \
  --type github --url https://github.com/<owner>/<repo> --usage commentary
```

The website route uses HyperFrames capture to preserve the public page's
screenshots, extracted visible text, design tokens, and discovered visual
assets. The GitHub route stores public repository metadata, the exact
default-branch commit response, and README snapshot where available. It also
captures the public repository page unless `--skip-page-capture` is a conscious
trade-off.

The command accepts only credential-free HTTPS URLs, never logs into a site,
and refuses to overwrite an existing dossier or non-empty `capture/` directory.
It calls no text-to-video, image-to-video, first/last-frame, or external video
generation provider.

## What the dossier proves

`production/source-dossier.json` contains:

- the canonical source URL, capture time, route, and planned use;
- every raw capture artifact's project-relative path, byte count, and SHA-256;
- compact source facts, each tied to an artifact and locator;
- a summary useful for planning, without treating generated summary text as a
  factual source.

The production fingerprint includes both the dossier and the listed raw files.
Changing either invalidates fingerprint-bound evidence.

## Claims and asset rights

Website headline, landing-page body copy, customer counts, and capability claims
are `source-claimed`. Say “the site presents…” or obtain an independent source
before presenting them as a verified factual statement. GitHub metadata is a
snapshot at the recorded branch commit; popularity numbers and repository state
can change afterwards.

Capture artifacts are evidence and visual reference, not a blanket right to
reuse them in a published video. Use the normal asset manifest only for local
assets actually selected for the edit, with a clear rights basis. Do not put
remote URLs or credentials in that manifest. `authorized-promotion` is valid
only when the user confirms they have authority; `commentary` is the safe
default for third-party sources.

## Creative gate

After capture, present a compact approval package:

1. audience and source thesis;
2. facts/claims with their source fact IDs and any uncertainty labels;
3. duration, ratio, tone, and narration approach;
4. script plus 3–8 beat storyboard;
5. asset plan and the boundary between reference and permitted media.

For a third-party website or repository, do not begin composition, render, or
publication until the user explicitly approves this package. A source dossier,
technical pass, or review checklist is not creative approval.
