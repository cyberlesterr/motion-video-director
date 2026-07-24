#!/usr/bin/env node

import {access, readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {assertControl, compileMotionPlan, createRuntimeFingerprint, fileRecord} from './production-lib.mjs';

const target = path.resolve(process.cwd(), process.argv[2] ?? '.');
const requiredFiles = ['DESIGN.md', 'index.html', 'project.json'];
const productionFiles = [
  'brief.json',
  'source-dossier.json',
  'beat-graph.json',
  'asset-manifest.json',
  'proof-plan.json',
  'delivery-report.json',
  'control.json',
];
const allowedFps = new Set([24, 30, 60]);
const allowedStatuses = new Set(['starter', 'production']);
const allowedSourceRoutes = new Set(['local-brief', 'website', 'github']);
const allowedSourceUses = new Set(['original', 'commentary', 'authorized-promotion']);
const allowedFactVerifications = new Set(['source-claimed', 'github-api-snapshot', 'user-supplied']);
const allowedNarrationModes = new Set(['none', 'local-audio', 'user-voice']);
const allowedNarrativeJobs = new Set(['hook', 'reveal', 'contrast', 'mechanism', 'consequence', 'proof', 'close']);
const allowedStateChangeKinds = new Set(['transform', 'travel', 'connect', 'split', 'accumulate', 'reveal', 'resolve', 'hold']);
const allowedAssetKinds = new Set(['image', 'video', 'audio', 'svg', 'lottie', 'font', 'other']);
const allowedAssetSources = new Set(['supplied', 'created-in-project', 'licensed-local']);
const allowedDeliveryStatuses = new Set(['not-run', 'in-progress', 'partial', 'passed', 'failed']);
const allowedCheckStatuses = new Set(['not-run', 'stale', 'passed', 'failed', 'not-applicable']);
const requiredDeliveryChecks = [
  'sourceContract',
  'compiledMotionPlan',
  'sourceFingerprint',
  'hyperframesLint',
  'hyperframesValidate',
  'hyperframesInspect',
  'animationMap',
  'render',
  'mediaProbe',
  'contactSheet',
  'styleProof',
  'reviewScaffold',
];

async function readRequired(relativePath) {
  const filePath = path.join(target, relativePath);
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    throw new Error(`Missing required project file: ${filePath}`);
  }
}

async function readJson(relativePath) {
  const filePath = path.join(target, relativePath);
  let text;

  try {
    text = await readFile(filePath, 'utf8');
  } catch {
    throw new Error(`Missing required production contract file: ${filePath}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertObject(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`);
}

function assertDuration(value, label) {
  assert(isFiniteNumber(value) && value > 0, `${label} must be a positive number.`);
}

function compositionAttributes(html) {
  const compositionTag = html.match(/<div\b(?=[^>]*\bdata-composition-id\s*=)[^>]*>/i)?.[0];
  assert(compositionTag, 'index.html must contain a composition div with data-composition-id.');

  const readAttribute = (name) => compositionTag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];

  return {
    id: readAttribute('data-composition-id'),
    duration: Number(readAttribute('data-duration')),
    width: Number(readAttribute('data-width')),
    height: Number(readAttribute('data-height')),
  };
}

function dimensionsForRatio(ratio) {
  if (ratio === '16:9') {
    return {width: 1920, height: 1080};
  }

  if (ratio === '9:16') {
    return {width: 1080, height: 1920};
  }

  throw new Error('brief.json ratio must be 16:9 or 9:16.');
}

function isHttpsUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function validateSourceDossier(sourceDossier, brief) {
  assertObject(sourceDossier, 'source-dossier.json');
  assert(sourceDossier.schemaVersion === 1, 'source-dossier.json schemaVersion must be 1.');
  assert(['not-captured', 'captured'].includes(sourceDossier.status), 'source-dossier.json status must be not-captured or captured.');
  assertObject(sourceDossier.source, 'source-dossier.json source');
  assert(allowedSourceRoutes.has(sourceDossier.source.route), 'source-dossier.json source.route is unsupported.');
  assert(sourceDossier.source.route === brief.sourceRoute, 'source-dossier.json source.route must match brief.json sourceRoute.');
  assert(allowedSourceUses.has(sourceDossier.source.usage), 'source-dossier.json source.usage is unsupported.');
  assertObject(sourceDossier.capture, 'source-dossier.json capture');
  assert(isNonEmptyString(sourceDossier.capture.directory), 'source-dossier.json capture.directory must be a non-empty relative path.');
  assert(!path.isAbsolute(sourceDossier.capture.directory), 'source-dossier.json capture.directory must not be absolute.');
  assert(Array.isArray(sourceDossier.capture.artifacts), 'source-dossier.json capture.artifacts must be an array.');
  assert(Array.isArray(sourceDossier.facts), 'source-dossier.json facts must be an array.');
  assert(Array.isArray(sourceDossier.assetCandidates), 'source-dossier.json assetCandidates must be an array.');

  const captureDirectory = path.resolve(target, sourceDossier.capture.directory);
  const captureRelative = path.relative(target, captureDirectory);
  assert(captureRelative && !captureRelative.startsWith(`..${path.sep}`) && captureRelative !== '..', 'source-dossier.json capture.directory must stay inside the project directory.');

  if (sourceDossier.status === 'not-captured') {
    assert(sourceDossier.source.route === 'local-brief', 'Only local-brief projects may remain not-captured.');
    assert(sourceDossier.source.canonicalUrl === null, 'A not-captured local-brief must not set canonicalUrl.');
    assert(sourceDossier.source.capturedAt === null, 'A not-captured local-brief must not set capturedAt.');
    assert(sourceDossier.source.usage === 'original', 'A not-captured local-brief must use original usage.');
    assert(sourceDossier.capture.artifacts.length === 0, 'A not-captured local-brief must not list capture artifacts.');
    assert(sourceDossier.facts.length === 0, 'A not-captured local-brief must not list source facts.');
  } else {
    assert(['website', 'github'].includes(sourceDossier.source.route), 'Captured source dossiers must be a website or GitHub route.');
    assert(isHttpsUrl(sourceDossier.source.canonicalUrl), 'A captured source dossier needs a credential-free HTTPS canonicalUrl.');
    assert(isNonEmptyString(sourceDossier.source.capturedAt) && Number.isFinite(Date.parse(sourceDossier.source.capturedAt)), 'A captured source dossier needs an ISO capturedAt timestamp.');
    assert(sourceDossier.capture.artifacts.length >= 1, 'A captured source dossier needs at least one raw artifact.');
  }

  const artifactPaths = new Set();
  for (const artifact of sourceDossier.capture.artifacts) {
    assertObject(artifact, 'source capture artifact');
    assert(isNonEmptyString(artifact.scope), 'Each source capture artifact needs a scope.');
    assert(isNonEmptyString(artifact.path) && !path.isAbsolute(artifact.path), 'Each source capture artifact needs a relative path.');
    assert(!artifactPaths.has(artifact.path), `Source capture artifact path is duplicated: ${artifact.path}.`);
    artifactPaths.add(artifact.path);
    assert(Number.isInteger(artifact.bytes) && artifact.bytes >= 0, `Source capture artifact ${artifact.path} needs a non-negative integer byte count.`);
    assert(typeof artifact.sha256 === 'string' && /^[a-f0-9]{64}$/.test(artifact.sha256), `Source capture artifact ${artifact.path} needs a SHA-256 digest.`);
    const artifactPath = path.resolve(target, artifact.path);
    const relativeToProject = path.relative(target, artifactPath);
    const relativeToCapture = path.relative(captureDirectory, artifactPath);
    assert(relativeToProject && !relativeToProject.startsWith(`..${path.sep}`) && relativeToProject !== '..', `Source capture artifact ${artifact.path} must stay inside the project directory.`);
    assert(relativeToCapture && !relativeToCapture.startsWith(`..${path.sep}`) && relativeToCapture !== '..', `Source capture artifact ${artifact.path} must stay below ${sourceDossier.capture.directory}.`);
    assert(await pathExists(artifactPath), `Source capture artifact ${artifact.path} is missing.`);
    assert((await stat(artifactPath)).isFile(), `Source capture artifact ${artifact.path} must be a file.`);
    const actual = await fileRecord(artifact.scope, artifact.path, artifactPath);
    assert(actual.bytes === artifact.bytes && actual.sha256 === artifact.sha256, `Source capture artifact ${artifact.path} does not match its recorded digest.`);
  }

  const factIds = new Set();
  for (const fact of sourceDossier.facts) {
    assertObject(fact, 'source fact');
    assert(isNonEmptyString(fact.id) && !factIds.has(fact.id), 'Each source fact needs a unique, non-empty id.');
    factIds.add(fact.id);
    assert(isNonEmptyString(fact.statement), `Source fact ${fact.id} needs a non-empty statement.`);
    assert(isNonEmptyString(fact.sourcePath) && artifactPaths.has(fact.sourcePath), `Source fact ${fact.id} must point to a captured raw artifact.`);
    assert(isNonEmptyString(fact.locator), `Source fact ${fact.id} needs a locator.`);
    assert(allowedFactVerifications.has(fact.verification), `Source fact ${fact.id} has an unsupported verification method.`);
  }

  return factIds;
}

async function validateProductionContract(project, html) {
  const productionDirectory = path.join(target, 'production');
  const productionExists = await pathExists(productionDirectory);

  if (!productionExists) {
    console.log('INFO no production planning contract found; source-only validation completed.');
    return;
  }

  assert((await stat(productionDirectory)).isDirectory(), `${productionDirectory} must be a directory.`);
  const [brief, sourceDossier, beatGraph, assetManifest, proofPlan, deliveryReport, control] = await Promise.all(
    productionFiles.map((file) => readJson(path.join('production', file))),
  );

  assertObject(brief, 'brief.json');
  assert(brief.schemaVersion === 1, 'brief.json schemaVersion must be 1.');
  assert(allowedStatuses.has(brief.status), 'brief.json status must be starter or production.');
  for (const field of ['projectId', 'title', 'audience', 'motionThesis']) {
    assert(isNonEmptyString(brief[field]), `brief.json ${field} must be a non-empty string.`);
  }
  assertDuration(brief.durationSeconds, 'brief.json durationSeconds');
  if (brief.status === 'production') {
    assert(brief.durationSeconds >= 10 && brief.durationSeconds <= 60, 'production durationSeconds must be between 10 and 60.');
  } else {
    assert(brief.durationSeconds <= 60, 'starter durationSeconds must be at most 60.');
  }
  assert(allowedFps.has(brief.fps), 'brief.json fps must be 24, 30, or 60.');
  assert(allowedSourceRoutes.has(brief.sourceRoute), 'brief.json sourceRoute must be local-brief, website, or github.');
  assertObject(brief.narration, 'brief.json narration');
  assert(allowedNarrationModes.has(brief.narration.mode), 'brief.json narration.mode is unsupported.');
  assertObject(brief.generationPolicy, 'brief.json generationPolicy');
  for (const key of ['textToVideo', 'imageToVideo', 'firstLastFrameVideo']) {
    assert(brief.generationPolicy[key] === 'prohibited', `brief.json generationPolicy.${key} must be prohibited.`);
  }
  assert(Array.isArray(brief.factualClaims), 'brief.json factualClaims must be an array.');
  const sourceFactIds = await validateSourceDossier(sourceDossier, brief);
  const claimIds = new Set();
  for (const claim of brief.factualClaims) {
    assertObject(claim, 'factual claim');
    assert(isNonEmptyString(claim.id) && !claimIds.has(claim.id), 'Each factual claim needs a unique, non-empty id.');
    claimIds.add(claim.id);
    assert(isNonEmptyString(claim.claim), `Factual claim ${claim.id} needs a non-empty claim.`);
    assert(Array.isArray(claim.sourceFactIds) && claim.sourceFactIds.length >= 1, `Factual claim ${claim.id} needs at least one sourceFactId.`);
    for (const sourceFactId of claim.sourceFactIds) {
      assert(isNonEmptyString(sourceFactId) && sourceFactIds.has(sourceFactId), `Factual claim ${claim.id} references an unknown source fact: ${sourceFactId}.`);
    }
  }

  const dimensions = dimensionsForRatio(brief.ratio);
  const composition = compositionAttributes(html);
  assert(brief.projectId === project.id, 'brief.json projectId must match project.json id.');
  assert(brief.durationSeconds === project.durationSeconds, 'brief.json durationSeconds must match project.json.');
  assert(brief.fps === project.fps, 'brief.json fps must match project.json.');
  assert(dimensions.width === project.width && dimensions.height === project.height, 'brief.json ratio must match project.json dimensions.');
  assert(composition.id === project.id, 'index.html composition id must match project.json id.');
  assert(composition.duration === project.durationSeconds, 'index.html data-duration must match project.json durationSeconds.');
  assert(composition.width === project.width && composition.height === project.height, 'index.html dimensions must match project.json.');

  assertObject(beatGraph, 'beat-graph.json');
  assert(beatGraph.schemaVersion === 1, 'beat-graph.json schemaVersion must be 1.');
  assert(Array.isArray(beatGraph.beats) && beatGraph.beats.length >= 3 && beatGraph.beats.length <= 8, 'beat-graph.json must contain 3–8 beats.');

  const beatIds = new Set();
  let previousStart = -1;
  let stateChangeCount = 0;
  const beatById = new Map();

  for (const beat of beatGraph.beats) {
    assertObject(beat, 'beat');
    assert(isNonEmptyString(beat.id) && !beatIds.has(beat.id), 'Every beat needs a unique, non-empty id.');
    beatIds.add(beat.id);
    assertDuration(beat.endSeconds, `Beat ${beat.id} endSeconds`);
    assert(isFiniteNumber(beat.startSeconds) && beat.startSeconds >= 0 && beat.startSeconds < beat.endSeconds, `Beat ${beat.id} must have an ordered startSeconds/endSeconds range.`);
    assert(beat.endSeconds <= brief.durationSeconds, `Beat ${beat.id} extends past the project duration.`);
    assert(beat.startSeconds >= previousStart, 'beat-graph.json beats must be ordered by startSeconds.');
    previousStart = beat.startSeconds;
    assert(allowedNarrativeJobs.has(beat.narrativeJob), `Beat ${beat.id} has an unsupported narrativeJob.`);
    assert(isNonEmptyString(beat.mainMovingObject), `Beat ${beat.id} must name a mainMovingObject.`);
    assert(allowedStateChangeKinds.has(beat.stateChangeKind), `Beat ${beat.id} has an unsupported stateChangeKind.`);
    assert(isNonEmptyString(beat.stateChange), `Beat ${beat.id} must describe a concrete stateChange.`);
    for (const field of ['cameraOrLayerMotion', 'textRole', 'assetNeed', 'pptRisk']) {
      assert(isNonEmptyString(beat[field]), `Beat ${beat.id} ${field} must be a non-empty string.`);
    }
    if (beat.stateChangeKind !== 'hold') {
      stateChangeCount += 1;
    }
    beatById.set(beat.id, beat);
  }

  assert(stateChangeCount / beatGraph.beats.length >= 0.8, 'At least 80% of beats must have a concrete state change.');

  assertObject(proofPlan, 'proof-plan.json');
  assert(proofPlan.schemaVersion === 1, 'proof-plan.json schemaVersion must be 1.');
  assertObject(proofPlan.styleProof, 'proof-plan.json styleProof');
  assert(Array.isArray(proofPlan.styleProof.targetBeatIds) && proofPlan.styleProof.targetBeatIds.length >= 1 && proofPlan.styleProof.targetBeatIds.length <= 2, 'proof-plan.json styleProof needs one or two targetBeatIds.');
  assert(isNonEmptyString(proofPlan.styleProof.rationale), 'proof-plan.json styleProof needs a rationale.');
  assert(Array.isArray(proofPlan.approvedHolds), 'proof-plan.json approvedHolds must be an array.');
  assert(Array.isArray(proofPlan.scenes) && proofPlan.scenes.length === beatGraph.beats.length, 'proof-plan.json must contain one scene entry per beat.');
  const proofBeatIds = new Set();
  for (const scene of proofPlan.scenes) {
    assertObject(scene, 'proof-plan scene');
    const beat = beatById.get(scene.beatId);
    assert(beat && !proofBeatIds.has(scene.beatId), 'Each proof-plan scene must reference one unique beat id.');
    proofBeatIds.add(scene.beatId);
    assert(isNonEmptyString(scene.intent), `Proof-plan scene ${scene.beatId} must have an intent.`);
    assert(Array.isArray(scene.proofTimes) && scene.proofTimes.length >= 3, `Proof-plan scene ${scene.beatId} needs at least three proof times.`);
    for (const proofTime of scene.proofTimes) {
      assert(isFiniteNumber(proofTime) && proofTime >= beat.startSeconds && proofTime <= beat.endSeconds, `Proof time for ${scene.beatId} must be inside its beat.`);
    }
  }
  const styleTargetIds = new Set();
  for (const beatId of proofPlan.styleProof.targetBeatIds) {
    assert(beatById.has(beatId) && !styleTargetIds.has(beatId), 'Each styleProof targetBeatId must name one unique beat.');
    styleTargetIds.add(beatId);
  }
  const holdIds = new Set();
  for (const hold of proofPlan.approvedHolds) {
    assertObject(hold, 'approved hold');
    assert(isNonEmptyString(hold.id) && !holdIds.has(hold.id), 'Each approved hold needs a unique, non-empty id.');
    holdIds.add(hold.id);
    const beat = beatById.get(hold.beatId);
    assert(beat, `Approved hold ${hold.id} must reference an existing beat.`);
    assert(isFiniteNumber(hold.startSeconds) && isFiniteNumber(hold.endSeconds) && hold.startSeconds < hold.endSeconds, `Approved hold ${hold.id} must have an ordered time range.`);
    assert(hold.startSeconds >= beat.startSeconds && hold.endSeconds <= beat.endSeconds, `Approved hold ${hold.id} must stay inside its beat.`);
    assert(hold.endSeconds - hold.startSeconds <= 2.5, `Approved hold ${hold.id} must be at most 2.5 seconds.`);
    assert(isFiniteNumber(hold.proofTime) && hold.proofTime >= hold.startSeconds && hold.proofTime <= hold.endSeconds, `Approved hold ${hold.id} proofTime must be inside the hold.`);
    assert(isNonEmptyString(hold.rationale), `Approved hold ${hold.id} needs a rationale.`);
  }

  assertObject(assetManifest, 'asset-manifest.json');
  assert(assetManifest.schemaVersion === 1, 'asset-manifest.json schemaVersion must be 1.');
  assert(Array.isArray(assetManifest.assets), 'asset-manifest.json assets must be an array.');
  const assetIds = new Set();
  for (const asset of assetManifest.assets) {
    assertObject(asset, 'asset-manifest asset');
    assert(isNonEmptyString(asset.id) && !assetIds.has(asset.id), 'Every asset needs a unique, non-empty id.');
    assetIds.add(asset.id);
    assert(allowedAssetKinds.has(asset.kind), `Asset ${asset.id} has an unsupported kind.`);
    assert(allowedAssetSources.has(asset.source), `Asset ${asset.id} has an unsupported source.`);
    assert(isNonEmptyString(asset.role), `Asset ${asset.id} must have a role.`);
    assert(isNonEmptyString(asset.relativePath), `Asset ${asset.id} must have a relativePath.`);
    assert(!path.isAbsolute(asset.relativePath), `Asset ${asset.id} relativePath must not be absolute.`);
    const resolvedPath = path.resolve(target, asset.relativePath);
    const relativeToProject = path.relative(target, resolvedPath);
    assert(relativeToProject && !relativeToProject.startsWith(`..${path.sep}`) && relativeToProject !== '..', `Asset ${asset.id} must stay inside the project directory.`);
    assert(await pathExists(resolvedPath), `Asset ${asset.id} does not exist at ${asset.relativePath}.`);
    assert((await stat(resolvedPath)).isFile(), `Asset ${asset.id} must reference a file, not a directory.`);
  }

  assertObject(deliveryReport, 'delivery-report.json');
  assert(deliveryReport.schemaVersion === 1, 'delivery-report.json schemaVersion must be 1.');
  assert(allowedDeliveryStatuses.has(deliveryReport.status), 'delivery-report.json status is unsupported.');
  assertObject(deliveryReport.checks, 'delivery-report.json checks');
  for (const check of requiredDeliveryChecks) {
    assert(allowedCheckStatuses.has(deliveryReport.checks[check]), `delivery-report.json checks.${check} is missing or unsupported.`);
  }
  assert(Array.isArray(deliveryReport.notes), 'delivery-report.json notes must be an array.');

  assertControl(control);
  if (control.stage === 'complete') {
    assert(deliveryReport.status === 'passed', 'A complete control stage requires delivery-report.json status=passed.');
  }

  const compiledPlanPath = path.join(productionDirectory, 'compiled-motion-plan.json');
  const runtimeFingerprintPath = path.join(productionDirectory, 'runtime-fingerprint.json');
  const expectedCompiledPlan = compileMotionPlan({project, brief, sourceDossier, beatGraph, proofPlan});

  if (deliveryReport.checks.compiledMotionPlan === 'passed') {
    const compiledPlan = await readJson(path.join('production', 'compiled-motion-plan.json'));
    assert(compiledPlan.schemaVersion === 1, 'compiled-motion-plan.json schemaVersion must be 1.');
    assert(compiledPlan.planningFingerprint === expectedCompiledPlan.planningFingerprint, 'compiled-motion-plan.json is stale; recompile the motion plan.');
  } else {
    assert(!(await pathExists(compiledPlanPath)) || deliveryReport.checks.compiledMotionPlan !== 'not-run', 'compiled-motion-plan.json exists but delivery report does not record its status.');
  }

  const needsCurrentFingerprint = ['sourceFingerprint', 'render', 'styleProof', 'reviewScaffold'].some(
    (check) => deliveryReport.checks[check] === 'passed',
  );
  let currentFingerprint;
  if (needsCurrentFingerprint) {
    assert(await pathExists(runtimeFingerprintPath), 'A passed fingerprint-bound check requires production/runtime-fingerprint.json.');
    const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    currentFingerprint = await createRuntimeFingerprint(target, skillRoot);
    const recordedFingerprint = await readJson(path.join('production', 'runtime-fingerprint.json'));
    assert(recordedFingerprint.fingerprint === currentFingerprint.fingerprint, 'production/runtime-fingerprint.json is stale; regenerate evidence after source or runtime changes.');
    assert(deliveryReport.evidence?.sourceFingerprint?.value === currentFingerprint.fingerprint, 'delivery-report.json must bind sourceFingerprint evidence to the current runtime fingerprint.');
  }
  if (deliveryReport.checks.render === 'passed') {
    assert(deliveryReport.evidence?.renderedSourceFingerprint === currentFingerprint?.fingerprint, 'Passed render evidence must be bound to the current source fingerprint; rerender after source changes.');
  }
  if (deliveryReport.checks.styleProof === 'passed') {
    const styleProof = await readJson(path.join('production', 'style-proof.json'));
    assert(styleProof.scope === 'style' && styleProof.sourceFingerprint === currentFingerprint?.fingerprint, 'style-proof.json must bind to the current source fingerprint.');
    assert(Array.isArray(styleProof.targets) && styleProof.targets.length === proofPlan.styleProof.targetBeatIds.length, 'style-proof.json target coverage is incomplete.');
  }
  if (deliveryReport.checks.reviewScaffold === 'passed') {
    const reviewScaffold = await readJson(path.join('production', 'review-scaffold.json'));
    assert(reviewScaffold.sourceFingerprint === currentFingerprint?.fingerprint, 'review-scaffold.json must bind to the current source fingerprint.');
  }
  if (deliveryReport.status === 'passed') {
    for (const check of requiredDeliveryChecks) {
      assert(deliveryReport.checks[check] === 'passed', `delivery-report.json status=passed requires checks.${check}=passed.`);
    }
  }

  console.log(`PASS production planning contract: ${brief.status}, ${beatGraph.beats.length} beats, ${assetManifest.assets.length} local assets.`);
}

const [design, html, projectText] = await Promise.all(requiredFiles.map(readRequired));
const project = JSON.parse(projectText);

const htmlRequirements = [
  'data-composition-id=',
  'data-start=',
  'data-duration=',
  'data-track-index=',
  'window.__timelines',
  'gsap.timeline({paused: true})',
];

const missingHtmlRequirements = htmlRequirements.filter((requirement) => !html.includes(requirement));

if (!/^#\s+Design/i.test(design)) {
  throw new Error('DESIGN.md must start with a Design heading.');
}

for (const heading of ['## Style Prompt', '## Colors', '## Typography', '## What Not To Do']) {
  if (!design.includes(heading)) {
    throw new Error(`DESIGN.md is missing required section: ${heading}`);
  }
}

if (!project.id || !Number.isInteger(project.width) || !Number.isInteger(project.height)) {
  throw new Error('project.json must include id plus integer width and height.');
}

if (!allowedFps.has(project.fps) || !(project.durationSeconds > 0)) {
  throw new Error('project.json must use fps 24, 30, or 60 and a positive durationSeconds.');
}

if (missingHtmlRequirements.length > 0) {
  throw new Error(`index.html is missing HyperFrames contract: ${missingHtmlRequirements.join(', ')}`);
}

for (const forbidden of [/Math\.random\s*\(/, /Date\.now\s*\(/, /repeat\s*:\s*-1/]) {
  if (forbidden.test(html)) {
    throw new Error(`index.html contains a non-deterministic or non-renderable pattern: ${forbidden}`);
  }
}

await validateProductionContract(project, html);

console.log(`PASS motion-video-director source contract: ${target}`);
console.log(`Composition ${project.id}: ${project.width}x${project.height}, ${project.fps}fps, ${project.durationSeconds}s`);
console.log('This check does not replace HyperFrames lint, validate, inspect, or a rendered visual review.');
