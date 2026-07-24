#!/usr/bin/env node

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
if (!args.project || !args.video || !args.output) {
  console.log('Usage: node capture-contact-sheet.mjs <project-directory> --video <relative-mp4> --output <relative-jpg>');
  process.exit(1);
}

const projectDir = path.resolve(args.project);
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionDir = path.join(projectDir, 'production');
const video = assertProjectRelativePath(projectDir, args.video, '--video');
const output = assertProjectRelativePath(projectDir, args.output, '--output');
await assertFile(video, 'Rendered video');
const [project, proofPlan, fingerprintRecord, deliveryReport] = await Promise.all([
  readJsonFile(path.join(projectDir, 'project.json'), 'project.json'),
  readJsonFile(path.join(productionDir, 'proof-plan.json'), 'production/proof-plan.json'),
  readJsonFile(path.join(productionDir, 'runtime-fingerprint.json'), 'production/runtime-fingerprint.json'),
  readJsonFile(path.join(productionDir, 'delivery-report.json'), 'production/delivery-report.json'),
]);
const currentFingerprint = await createRuntimeFingerprint(projectDir, skillRoot);
assert(fingerprintRecord.fingerprint === currentFingerprint.fingerprint, 'Runtime fingerprint is stale; rerender before capturing a contact sheet.');
assert(deliveryReport.evidence?.renderedSourceFingerprint === currentFingerprint.fingerprint, 'Rendered video is not bound to the current source fingerprint; rerender before capturing a contact sheet.');

const proofTimes = [...new Set(proofPlan.scenes.flatMap((scene) => scene.proofTimes))].sort((left, right) => left - right);
const frameNumbers = proofTimes.map((time) => Math.round(time * project.fps));
const columns = Math.min(4, frameNumbers.length);
const rows = Math.ceil(frameNumbers.length / columns);
const select = frameNumbers.map((frame) => `eq(n\\,${frame})`).join('+');
await run('ffmpeg', [
  '-y',
  '-v', 'error',
  '-i', video,
  '-vf', `select=${select},scale=480:-1,tile=${columns}x${rows}:padding=8:margin=8`,
  '-frames:v', '1',
  output,
]);
await assertFile(output, 'Contact sheet');

const outputRelative = path.relative(projectDir, output).split(path.sep).join('/');
deliveryReport.checks.contactSheet = 'passed';
deliveryReport.evidence = {
  ...(deliveryReport.evidence ?? {}),
  contactSheet: outputRelative,
  contactSheetArtifact: await fileRecord('artifact', outputRelative, output),
  contactSheetProofTimes: proofTimes,
  contactSheetSourceFingerprint: currentFingerprint.fingerprint,
};
await writeJsonFile(path.join(productionDir, 'delivery-report.json'), deliveryReport);
console.log(`Captured ${proofTimes.length} proof frames in ${outputRelative}.`);

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {stdio: 'inherit'});
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}.`));
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
