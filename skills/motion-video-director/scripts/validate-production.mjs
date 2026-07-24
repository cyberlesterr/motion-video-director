#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {
  advanceControl,
  assert,
  assertFile,
  createRuntimeFingerprint,
  readJsonFile,
  writeJsonFile,
} from './production-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.project) {
  console.log('Usage: node validate-production.mjs <project-directory> [--samples 15]');
  process.exit(1);
}

const projectDir = path.resolve(args.project);
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionDir = path.join(projectDir, 'production');
const sampleCount = Number(args.samples ?? 15);
assert(Number.isInteger(sampleCount) && sampleCount >= 3, '--samples must be an integer of at least 3.');
const hyperframesCli = path.join(projectDir, 'node_modules', '.bin', 'hyperframes');
await assertFile(hyperframesCli, 'Project-local HyperFrames CLI');

let fingerprint = await createRuntimeFingerprint(projectDir, skillRoot);
const deliveryPath = path.join(productionDir, 'delivery-report.json');
const preValidationReport = await readJsonFile(deliveryPath, 'production/delivery-report.json');
for (const check of ['sourceFingerprint', 'hyperframesLint', 'hyperframesValidate', 'hyperframesInspect', 'animationMap', 'render', 'mediaProbe', 'contactSheet', 'styleProof', 'reviewScaffold']) {
  if (preValidationReport.checks[check] === 'passed') {
    preValidationReport.checks[check] = 'stale';
  }
}
if (preValidationReport.status === 'passed') {
  preValidationReport.status = 'partial';
}
await writeJsonFile(path.join(productionDir, 'runtime-fingerprint.json'), fingerprint);
await writeJsonFile(deliveryPath, preValidationReport);
await run(process.execPath, [path.join(skillRoot, 'scripts', 'verify-contract.mjs'), projectDir], projectDir);
for (let attempt = 1; attempt <= 2; attempt += 1) {
  await run(hyperframesCli, ['check', '.'], projectDir);
  await run(hyperframesCli, ['lint', '.'], projectDir);
  await run(hyperframesCli, ['validate', '.'], projectDir);
  await run(hyperframesCli, ['inspect', '.', '--samples', String(sampleCount)], projectDir);
  await run(process.execPath, [path.join(skillRoot, 'scripts', 'animation-map.mjs'), '.', '--out', '.hyperframes/animation-map'], projectDir);

  const fingerprintAfterChecks = await createRuntimeFingerprint(projectDir, skillRoot);
  if (fingerprintAfterChecks.fingerprint === fingerprint.fingerprint) break;
  assert(attempt === 1, 'HyperFrames gates changed a fingerprinted input twice; inspect the project before trusting the evidence.');
  fingerprint = fingerprintAfterChecks;
  await writeJsonFile(path.join(productionDir, 'runtime-fingerprint.json'), fingerprint);
  console.log('Fingerprint changed during the first gate pass; repeating all gates against the stabilized inputs.');
}

const [map, proofPlan, deliveryReport, control] = await Promise.all([
  readJsonFile(path.join(projectDir, '.hyperframes', 'animation-map', 'animation-map.json'), '.hyperframes/animation-map/animation-map.json'),
  readJsonFile(path.join(productionDir, 'proof-plan.json'), 'production/proof-plan.json'),
  readJsonFile(deliveryPath, 'production/delivery-report.json'),
  readJsonFile(path.join(productionDir, 'control.json'), 'production/control.json'),
]);
const approvedHolds = proofPlan.approvedHolds ?? [];
for (const deadZone of map.deadZones ?? []) {
  const matchedHold = approvedHolds.find(
    (hold) => Math.abs(hold.startSeconds - deadZone.start) <= 0.05 && Math.abs(hold.endSeconds - deadZone.end) <= 0.05,
  );
  assert(matchedHold, `Animation map found unapproved dead zone ${deadZone.start}-${deadZone.end}s.`);
}

deliveryReport.checks.sourceContract = 'passed';
deliveryReport.checks.compiledMotionPlan = 'passed';
deliveryReport.checks.sourceFingerprint = 'passed';
deliveryReport.checks.hyperframesLint = 'passed';
deliveryReport.checks.hyperframesValidate = 'passed';
deliveryReport.checks.hyperframesInspect = 'passed';
deliveryReport.checks.animationMap = 'passed';
deliveryReport.evidence = {
  ...(deliveryReport.evidence ?? {}),
  sourceFingerprint: {
    path: 'production/runtime-fingerprint.json',
    value: fingerprint.fingerprint,
  },
  validation: {
    sourceFingerprint: fingerprint.fingerprint,
    animationMap: '.hyperframes/animation-map/animation-map.json',
    inspectedSamples: sampleCount,
    approvedHoldIds: approvedHolds.map((hold) => hold.id),
  },
};
if (control.stage === 'validate') {
  await writeJsonFile(
    path.join(productionDir, 'control.json'),
    advanceControl(control, 'review', 'validated-production', 'Contract, HyperFrames checks, animation map, and approved-hold coverage passed.'),
  );
}
await writeJsonFile(path.join(productionDir, 'delivery-report.json'), deliveryReport);
console.log(`Validated production at ${sampleCount} inspect samples with ${approvedHolds.length} approved hold(s).`);

function run(command, commandArgs, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {cwd, stdio: 'inherit'});
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with ${code}.`));
    });
  });
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[index + 1];
      assert(next && !next.startsWith('--'), `${value} needs a value.`);
      result[key] = argv[++index];
    } else if (!result.project) {
      result.project = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }
  return result;
}
