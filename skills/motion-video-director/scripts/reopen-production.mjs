#!/usr/bin/env node

import path from 'node:path';
import {assert, assertControl, controlStages, readJsonFile, writeJsonFile} from './production-lib.mjs';

const [projectArgument, stage, ...noteParts] = process.argv.slice(2);
if (!projectArgument || !stage || noteParts.length === 0 || projectArgument === '--help' || projectArgument === '-h') {
  console.log('Usage: node reopen-production.mjs <project-directory> <build|validate> <reason>');
  process.exit(projectArgument ? 0 : 1);
}

assert(['build', 'validate'].includes(stage), 'Reopened productions must return to build or validate.');
const projectDir = path.resolve(process.cwd(), projectArgument);
const productionDir = path.join(projectDir, 'production');
const controlPath = path.join(productionDir, 'control.json');
const deliveryPath = path.join(productionDir, 'delivery-report.json');
const [control, deliveryReport] = await Promise.all([
  readJsonFile(controlPath, 'production/control.json'),
  readJsonFile(deliveryPath, 'production/delivery-report.json'),
]);
assertControl(control);
assert(controlStages.indexOf(stage) < controlStages.indexOf(control.stage), `Cannot reopen ${control.stage} to ${stage}.`);

for (const check of ['sourceFingerprint', 'hyperframesLint', 'hyperframesValidate', 'hyperframesInspect', 'animationMap', 'render', 'mediaProbe', 'contactSheet', 'styleProof', 'reviewScaffold']) {
  if (deliveryReport.checks[check] === 'passed') {
    deliveryReport.checks[check] = 'stale';
  }
}
deliveryReport.status = 'partial';
control.stage = stage;
control.events = [...control.events, {
  stage,
  action: 'reopened-production',
  note: noteParts.join(' '),
}];

await writeJsonFile(controlPath, control);
await writeJsonFile(deliveryPath, deliveryReport);
console.log(`Reopened ${projectDir} at ${stage}.`);
