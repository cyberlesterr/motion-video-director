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
if (!args.project || !args.output) {
  console.log('Usage: node render-production.mjs <project-directory> --output <relative-mp4> [--quality standard] [--workers 2] [--format mp4]');
  process.exit(1);
}

const projectDir = path.resolve(args.project);
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = assertProjectRelativePath(projectDir, args.output, '--output');
const outputRelative = path.relative(projectDir, output).split(path.sep).join('/');
const productionDir = path.join(projectDir, 'production');
const hyperframesCli = path.join(projectDir, 'node_modules', '.bin', 'hyperframes');
await assertFile(hyperframesCli, 'Project-local HyperFrames CLI');

const fingerprint = await createRuntimeFingerprint(projectDir, skillRoot);
const deliveryPath = path.join(productionDir, 'delivery-report.json');
const preRenderReport = await readJsonFile(deliveryPath, 'production/delivery-report.json');
for (const check of ['sourceContract', 'compiledMotionPlan', 'sourceFingerprint', 'hyperframesLint', 'hyperframesValidate', 'hyperframesInspect', 'animationMap']) {
  assert(preRenderReport.checks[check] === 'passed', `render-production.mjs requires checks.${check}=passed.`);
}
assert(
  preRenderReport.evidence?.validation?.sourceFingerprint === fingerprint.fingerprint,
  'Source validation is not bound to the current runtime fingerprint; rerun validate-production.mjs before rendering.',
);
await writeJsonFile(path.join(productionDir, 'runtime-fingerprint.json'), fingerprint);

const renderArgs = ['render', '.', '--output', output];
for (const key of ['quality', 'workers', 'format']) {
  if (args[key]) renderArgs.push(`--${key}`, args[key]);
}
await run(hyperframesCli, renderArgs, projectDir);

const fingerprintAfterRender = await createRuntimeFingerprint(projectDir, skillRoot);
assert(
  fingerprintAfterRender.fingerprint === fingerprint.fingerprint,
  'Rendering changed a fingerprinted input; rerun validation before recording render evidence.',
);
const media = await probe(output);
const deliveryReport = await readJsonFile(deliveryPath, 'production/delivery-report.json');
deliveryReport.checks.sourceFingerprint = 'passed';
deliveryReport.checks.render = 'passed';
deliveryReport.checks.mediaProbe = 'passed';
deliveryReport.evidence = {
  ...(deliveryReport.evidence ?? {}),
  sourceFingerprint: {
    path: 'production/runtime-fingerprint.json',
    value: fingerprint.fingerprint,
  },
  renderedSourceFingerprint: fingerprint.fingerprint,
  renderOutput: outputRelative,
  renderArtifact: await fileRecord('artifact', outputRelative, output),
  media,
};
await writeJsonFile(deliveryPath, deliveryReport);
console.log(`Recorded render evidence for ${outputRelative}.`);

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

function probe(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames,duration',
      '-show_entries', 'format=duration,size',
      '-of', 'json',
      filePath,
    ]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with ${code}: ${stderr.trim()}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`ffprobe emitted invalid JSON: ${error.message}`));
      }
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
