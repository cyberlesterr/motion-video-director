# Styleframe Review — Paper Collage Video Recut

The five PNGs in `preproduction/styleframes/` are designed hero frames, not
screenshots sampled from an unfinished animation. They are the creative gate
for the later HyperFrames build.

| Frame | Review question | Required outcome |
| --- | --- | --- |
| `sf-01` | Does one unfinished scene read as the problem? | The boat scene is the hero; fragments frame it without becoming a card grid. |
| `sf-02` | Does the world appear to rise from a real construction seam? | The shared fold, depth order, and ground shadows make the system feel material. |
| `sf-03` | Does human direction visibly change the work? | One stamp carries the impact; surrounding choices become fixed evidence. |
| `sf-04` | Is the technical relation proven rather than described? | The only red proof line visibly starts on the character and ends on the boat. |
| `sf-05` | Does the close feel like an artifact encounter rather than a CTA? | The authentic project page is readable inside a physical folio and the URL belongs to its spine. |

## Decision required before build

Approve the visual direction only if all five frames pass their stated review
question. On approval, change `preproduction/styleframe-review.json` to
`status: "approved"`, add a concise approval record, then use the same shot
map and approved hero states to create the real HyperFrames project. A request
to revise a frame should change its corresponding shot-map entry before any
animation is written.

## Capture

Regenerate the review PNGs with the already-installed local browser runtime:

```bash
node preproduction/capture-styleframes.mjs
```
