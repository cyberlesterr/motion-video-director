#!/usr/bin/env node

import {mkdir, readdir, rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {
  assert,
  assertFile,
  assertProjectRelativePath,
  createRuntimeFingerprint,
  fileRecord,
  readJsonFile,
  writeJsonFile,
} from './production-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.project) {
  console.log('Usage: node style-proof.mjs <project-directory> [--out production/style-proof.json] [--frames-out dist/style-proof/frames]');
  process.exit(1);
}

const projectDir = path.resolve(args.project);
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionDir = path.join(projectDir, 'production');
const proofOutput = assertProjectRelativePath(projectDir, args.out ?? 'production/style-proof.json', '--out');
const framesDirectory = assertProjectRelativePath(projectDir, args['frames-out'] ?? 'dist/style-proof/frames', '--frames-out');
const [compiledPlan, recordedFingerprint, deliveryReport] = await Promise.all([
  readJsonFile(path.join(productionDir, 'compiled-motion-plan.json'), 'production/compiled-motion-plan.json'),
  readJsonFile(path.join(productionDir, 'runtime-fingerprint.json'), 'production/runtime-fingerprint.json'),
  readJsonFile(path.join(productionDir, 'delivery-report.json'), 'production/delivery-report.json'),
]);
const currentFingerprint = await createRuntimeFingerprint(projectDir, skillRoot);

assert(recordedFingerprint.fingerprint === currentFingerprint.fingerprint, 'Runtime fingerprint is stale; run fingerprint-production.mjs before style proof.');
assert(Array.isArray(compiledPlan.styleProofTargets) && compiledPlan.styleProofTargets.length > 0, 'Compiled motion plan must contain one or more style-proof targets.');

const proofTimes = [...new Set(compiledPlan.styleProofTargets.flatMap((target) => target.proofTimes))].sort((left, right) => left - right);
const hyperframesCli = path.join(projectDir, 'node_modules', '.bin', 'hyperframes');
await assertFile(hyperframesCli, 'Project-local HyperFrames CLI');
await mkdir(framesDirectory, {recursive: true});
for (const name of await readdir(framesDirectory)) {
  if (name.endsWith('.png') || name === 'contact-sheet.jpg') {
    await rm(path.join(framesDirectory, name), {force: true});
  }
}
await run(hyperframesCli, ['snapshot', '.', '--output', framesDirectory, '--at', proofTimes.join(','), '--no-end'], projectDir);

const frameNames = (await readdir(framesDirectory)).filter((name) => name.endsWith('.png')).sort();
assert(frameNames.length === proofTimes.length, 'HyperFrames snapshot did not produce exactly the requested style-proof frames.');
const frames = await Promise.all(
  frameNames.map(async (name) => {
    const filePath = path.join(framesDirectory, name);
    const relativePath = path.relative(projectDir, filePath);
    return fileRecord('evidence', relativePath, filePath);
  }),
);
const manifest = {
  schemaVersion: 1,
  scope: 'style',
  sourceFingerprint: currentFingerprint.fingerprint,
  planningFingerprint: compiledPlan.planningFingerprint,
  targets: compiledPlan.styleProofTargets,
  evidence: {
    framesDirectory: path.relative(projectDir, framesDirectory).split(path.sep).join('/'),
    frames,
  },
  reviewRequirements: [
    'Inspect every target at its named proof times as actual HyperFrames pixels.',
    'Confirm the target state change is legible without relying on a slide-like card sequence.',
    'Confirm text hierarchy, intended relationships, and any approved hold are readable.',
  ],
};

deliveryReport.checks.sourceFingerprint = 'passed';
deliveryReport.checks.styleProof = 'passed';
deliveryReport.evidence = {
  ...(deliveryReport.evidence ?? {}),
  sourceFingerprint: {
    path: 'production/runtime-fingerprint.json',
    value: currentFingerprint.fingerprint,
  },
  styleProof: {
    manifest: path.relative(projectDir, proofOutput).split(path.sep).join('/'),
    frameCount: frames.length,
    sourceFingerprint: currentFingerprint.fingerprint,
  },
};

await writeJsonFile(proofOutput, manifest);
await writeJsonFile(path.join(productionDir, 'delivery-report.json'), deliveryReport);
console.log(`Style proof captured ${frames.length} frames for ${compiledPlan.styleProofTargets.length} target(s).`);
console.log(`Style proof manifest: ${proofOutput}`);

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
      result[key] = next && !next.startsWith('--') ? argv[++index] : true;
    } else if (!result.project) {
      result.project = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }
  return result;
}
