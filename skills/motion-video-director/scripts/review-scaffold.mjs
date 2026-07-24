#!/usr/bin/env node

import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {
  assert,
  assertProjectRelativePath,
  createRuntimeFingerprint,
  readJsonFile,
  writeJsonFile,
} from './production-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.project) {
  console.log('Usage: node review-scaffold.mjs <project-directory> [--out production/review-scaffold.json]');
  process.exit(1);
}

const projectDir = path.resolve(args.project);
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionDir = path.join(projectDir, 'production');
const output = assertProjectRelativePath(projectDir, args.out ?? 'production/review-scaffold.json', '--out');
const [compiledPlan, recordedFingerprint, deliveryReport, styleProof] = await Promise.all([
  readJsonFile(path.join(productionDir, 'compiled-motion-plan.json'), 'production/compiled-motion-plan.json'),
  readJsonFile(path.join(productionDir, 'runtime-fingerprint.json'), 'production/runtime-fingerprint.json'),
  readJsonFile(path.join(productionDir, 'delivery-report.json'), 'production/delivery-report.json'),
  readOptionalJson(path.join(productionDir, 'style-proof.json')),
]);
const currentFingerprint = await createRuntimeFingerprint(projectDir, skillRoot);
assert(recordedFingerprint.fingerprint === currentFingerprint.fingerprint, 'Runtime fingerprint is stale; regenerate it before creating a review scaffold.');

const styleTargetIds = new Set(compiledPlan.styleProofTargets.map((target) => target.beatId));
const items = [
  ...compiledPlan.beats.map((beat) => ({
    id: `beat:${beat.id}`,
    kind: 'beat',
    beatId: beat.id,
    proofTimes: beat.proofTimes,
    checks: beat.reviewChecks,
    requiredEvidence: styleTargetIds.has(beat.id) ? 'style-proof frame set' : 'contact sheet and named proof frames',
    note: `Review ${beat.mainMovingObject}: ${beat.stateChange}`,
  })),
  ...compiledPlan.approvedHolds.map((hold) => ({
    id: `hold:${hold.id}`,
    kind: 'approved-hold',
    beatId: hold.beatId,
    proofTimes: [hold.proofTime],
    checks: ['hold-is-readable', 'hold-is-not-padding', 'hold-preserves-final-state'],
    requiredEvidence: 'named proof frame and rendered timeline',
    note: hold.rationale,
  })),
];
const scaffold = {
  schemaVersion: 1,
  status: 'pending-review',
  sourceFingerprint: currentFingerprint.fingerprint,
  planningFingerprint: compiledPlan.planningFingerprint,
  styleProof: styleProof
    ? {manifest: 'production/style-proof.json', sourceFingerprint: styleProof.sourceFingerprint}
    : null,
  items,
  instructions: [
    'Review generated frames at useful size; do not mark a scaffold as a creative approval by itself.',
    'Record revision feedback beside the project source before changing the composition.',
    'Regenerate this scaffold after a source fingerprint changes.',
  ],
};

deliveryReport.checks.reviewScaffold = 'passed';
deliveryReport.evidence = {
  ...(deliveryReport.evidence ?? {}),
  reviewScaffold: {
    path: path.relative(projectDir, output).split(path.sep).join('/'),
    itemCount: items.length,
    sourceFingerprint: currentFingerprint.fingerprint,
  },
};

await writeJsonFile(output, scaffold);
await writeJsonFile(path.join(productionDir, 'delivery-report.json'), deliveryReport);
console.log(`Review scaffold contains ${items.length} item(s): ${output}`);

async function readOptionalJson(filePath) {
  try {
    return await readJsonFile(filePath);
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[index + 1];
      result[key] = next && !next.startsWith('--') ? argv[++index] : true;
    } else if (!result.project) {
      result.project = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }
  return result;
}
