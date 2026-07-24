import {access, readFile, stat, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

export const controlStages = ['plan', 'build', 'validate', 'review', 'complete'];

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile(filePath, label = filePath) {
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch {
    throw new Error(`Missing required file: ${label}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label}: ${error.message}`);
  }
}

export async function writeJsonFile(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function assertProjectRelativePath(projectDir, relativePath, label) {
  assert(isNonEmptyString(relativePath), `${label} must be a non-empty relative path.`);
  assert(!path.isAbsolute(relativePath), `${label} must not be absolute.`);
  const resolved = path.resolve(projectDir, relativePath);
  const relative = path.relative(projectDir, resolved);
  assert(relative && !relative.startsWith(`..${path.sep}`) && relative !== '..', `${label} must stay inside the project directory.`);
  return resolved;
}

export function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function jsonFingerprint(value) {
  return sha256(JSON.stringify(canonicalize(value)));
}

export async function fileRecord(scope, relativePath, filePath) {
  const content = await readFile(filePath);
  return {
    scope,
    path: relativePath.split(path.sep).join('/'),
    bytes: content.length,
    sha256: sha256(content),
  };
}

export async function loadPlanning(projectDir) {
  const productionDir = path.join(projectDir, 'production');
  const [project, brief, sourceDossier, beatGraph, proofPlan] = await Promise.all([
    readJsonFile(path.join(projectDir, 'project.json'), 'project.json'),
    readJsonFile(path.join(productionDir, 'brief.json'), 'production/brief.json'),
    readJsonFile(path.join(productionDir, 'source-dossier.json'), 'production/source-dossier.json'),
    readJsonFile(path.join(productionDir, 'beat-graph.json'), 'production/beat-graph.json'),
    readJsonFile(path.join(productionDir, 'proof-plan.json'), 'production/proof-plan.json'),
  ]);
  const shotPlanning = brief.schemaVersion === 2
    ? await Promise.all([
        readJsonFile(path.join(productionDir, 'shot-map.json'), 'production/shot-map.json'),
        readJsonFile(path.join(productionDir, 'styleframe-review.json'), 'production/styleframe-review.json'),
      ])
    : [null, null];
  const [shotMap, styleframeReview] = shotPlanning;
  return {project, brief, sourceDossier, shotMap, styleframeReview, beatGraph, proofPlan};
}

export function compileMotionPlan({project, brief, sourceDossier, shotMap, styleframeReview, beatGraph, proofPlan}) {
  const proofByBeat = new Map(proofPlan.scenes.map((scene) => [scene.beatId, scene]));
  const shotByBeat = new Map((shotMap?.shots ?? []).map((shot) => [shot.beatId, shot]));
  const styleTargetIds = proofPlan.styleProof?.targetBeatIds ?? [];
  const targetSet = new Set(styleTargetIds);
  const holds = proofPlan.approvedHolds ?? [];

  const beats = beatGraph.beats.map((beat) => {
    const proof = proofByBeat.get(beat.id);
    const shot = shotByBeat.get(beat.id);
    return {
      id: beat.id,
      startSeconds: beat.startSeconds,
      endSeconds: beat.endSeconds,
      normalizedStart: round(beat.startSeconds / brief.durationSeconds),
      normalizedEnd: round(beat.endSeconds / brief.durationSeconds),
      narrativeJob: beat.narrativeJob,
      mainMovingObject: beat.mainMovingObject,
      stateChangeKind: beat.stateChangeKind,
      stateChange: beat.stateChange,
      shot: shot ? {
        id: shot.id,
        family: shot.family,
        dominantSubject: shot.dominantSubject,
        cameraPlan: shot.cameraPlan,
        transitionOut: shot.transitionOut,
        styleframeId: shot.styleframeId,
        actionSeconds: shot.actionSeconds,
        settleSeconds: shot.settleSeconds,
      } : null,
      proofTimes: proof?.proofTimes ?? [],
      reviewChecks: [
        'state-change-visible',
        'moving-object-readable',
        'text-role-readable',
        'anti-slide-risk-reviewed',
        ...(shot ? ['dominant-subject-readable', 'shot-grammar-preserved', 'styleframe-matched'] : []),
      ],
    };
  });

  return {
    schemaVersion: 1,
    projectId: brief.projectId,
    durationSeconds: brief.durationSeconds,
    fps: brief.fps,
    motionThesis: brief.motionThesis,
    source: {
      route: sourceDossier.source.route,
      canonicalUrl: sourceDossier.source.canonicalUrl,
      captureStatus: sourceDossier.status,
      capturedAt: sourceDossier.source.capturedAt,
    },
    planningFingerprint: jsonFingerprint({project, brief, sourceDossier, shotMap, styleframeReview, beatGraph, proofPlan}),
    styleframeGate: styleframeReview ? {
      decisionMode: styleframeReview.decisionMode,
      status: styleframeReview.status,
      frameIds: styleframeReview.styleframes.map((frame) => frame.id),
    } : null,
    beats,
    approvedHolds: holds.map((hold) => ({...hold})),
    styleProofTargets: beats
      .filter((beat) => targetSet.has(beat.id))
      .map((beat) => ({
        beatId: beat.id,
        proofTimes: beat.proofTimes,
        rationale: proofPlan.styleProof.rationale,
      })),
  };
}

export function expectedPlanningFingerprint(planning) {
  return jsonFingerprint(planning);
}

export function assertControl(control, label = 'production/control.json') {
  assert(control && typeof control === 'object' && !Array.isArray(control), `${label} must be an object.`);
  assert(control.schemaVersion === 1, `${label} schemaVersion must be 1.`);
  assert(controlStages.includes(control.stage), `${label} stage is unsupported.`);
  assert(Array.isArray(control.events) && control.events.length >= 1, `${label} needs at least one event.`);
  for (const event of control.events) {
    assert(event && typeof event === 'object' && !Array.isArray(event), `${label} event must be an object.`);
    assert(controlStages.includes(event.stage), `${label} event stage is unsupported.`);
    assert(isNonEmptyString(event.action), `${label} event action must be a non-empty string.`);
    assert(isNonEmptyString(event.note), `${label} event note must be a non-empty string.`);
  }
}

export function advanceControl(control, nextStage, action, note) {
  assertControl(control);
  const currentIndex = controlStages.indexOf(control.stage);
  const nextIndex = controlStages.indexOf(nextStage);
  assert(nextIndex === currentIndex + 1, `Cannot advance control from ${control.stage} to ${nextStage}.`);
  assert(isNonEmptyString(note), 'A non-empty transition note is required.');
  return {
    ...control,
    stage: nextStage,
    events: [...control.events, {stage: nextStage, action, note}],
  };
}

export async function createRuntimeFingerprint(projectDir, skillRoot) {
  const requiredProjectFiles = [
    'DESIGN.md',
    'index.html',
    'project.json',
    'production/brief.json',
    'production/source-dossier.json',
    'production/beat-graph.json',
    'production/asset-manifest.json',
    'production/proof-plan.json',
    'production/compiled-motion-plan.json',
  ];
  const brief = await readJsonFile(path.join(projectDir, 'production', 'brief.json'));
  if (brief.schemaVersion === 2) {
    requiredProjectFiles.push('production/shot-map.json', 'production/styleframe-review.json');
  }
  const optionalProjectFiles = ['hyperframes.json', 'meta.json', 'package.json', 'package-lock.json'];
  const skillFiles = [
    'SKILL.md',
    'references/project-contract.md',
    'references/quality-gates.md',
    'references/shot-map.md',
    'references/source-dossier.md',
    'scripts/animation-map.mjs',
    'scripts/compile-motion-plan.mjs',
    'scripts/capture-contact-sheet.mjs',
    'scripts/capture-source.mjs',
    'scripts/finalize-production.mjs',
    'scripts/fingerprint-production.mjs',
    'scripts/production-lib.mjs',
    'scripts/render-production.mjs',
    'scripts/reopen-production.mjs',
    'scripts/resume-production.mjs',
    'scripts/review-scaffold.mjs',
    'scripts/set-production-stage.mjs',
    'scripts/style-proof.mjs',
    'scripts/validate-production.mjs',
    'scripts/verify-contract.mjs',
  ];
  const records = [];

  for (const relativePath of requiredProjectFiles) {
    const filePath = path.join(projectDir, relativePath);
    assert(await pathExists(filePath), `Fingerprint input is missing: ${relativePath}`);
    records.push(await fileRecord('project', relativePath, filePath));
  }
  for (const relativePath of optionalProjectFiles) {
    const filePath = path.join(projectDir, relativePath);
    if (await pathExists(filePath)) {
      records.push(await fileRecord('project', relativePath, filePath));
    }
  }

  const assetManifest = await readJsonFile(path.join(projectDir, 'production', 'asset-manifest.json'));
  for (const asset of assetManifest.assets ?? []) {
    const filePath = assertProjectRelativePath(projectDir, asset.relativePath, `Asset ${asset.id ?? '(unknown)'}`);
    assert(await pathExists(filePath), `Fingerprint asset is missing: ${asset.relativePath}`);
    records.push(await fileRecord('asset', asset.relativePath, filePath));
  }
  const sourceDossier = await readJsonFile(path.join(projectDir, 'production', 'source-dossier.json'));
  for (const artifact of sourceDossier.capture?.artifacts ?? []) {
    const filePath = assertProjectRelativePath(projectDir, artifact.path, `Source capture artifact ${artifact.path ?? '(unknown)'}`);
    assert(await pathExists(filePath), `Fingerprint source capture artifact is missing: ${artifact.path}`);
    records.push(await fileRecord('source-capture', artifact.path, filePath));
  }
  for (const relativePath of skillFiles) {
    const filePath = path.join(skillRoot, relativePath);
    assert(await pathExists(filePath), `Skill fingerprint input is missing: ${relativePath}`);
    records.push(await fileRecord('skill', relativePath, filePath));
  }

  records.sort((left, right) => `${left.scope}:${left.path}`.localeCompare(`${right.scope}:${right.path}`));
  return {
    schemaVersion: 1,
    algorithm: 'sha256',
    inputCount: records.length,
    inputs: records,
    fingerprint: jsonFingerprint(records),
  };
}

export function round(value) {
  return Math.round(value * 100000) / 100000;
}

export async function assertFile(filePath, label) {
  assert(await pathExists(filePath), `${label} does not exist: ${filePath}`);
  assert((await stat(filePath)).isFile(), `${label} must be a file: ${filePath}`);
}
