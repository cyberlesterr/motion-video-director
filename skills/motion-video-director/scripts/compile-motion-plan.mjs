#!/usr/bin/env node

import path from 'node:path';
import {
  advanceControl,
  assertControl,
  compileMotionPlan,
  loadPlanning,
  readJsonFile,
  writeJsonFile,
} from './production-lib.mjs';

const [projectArgument] = process.argv.slice(2);
if (!projectArgument || projectArgument === '--help' || projectArgument === '-h') {
  console.log('Usage: node compile-motion-plan.mjs <project-directory>');
  process.exit(projectArgument ? 0 : 1);
}

const projectDir = path.resolve(process.cwd(), projectArgument);
const planning = await loadPlanning(projectDir);
const compiledPlan = compileMotionPlan(planning);
const productionDir = path.join(projectDir, 'production');
const controlPath = path.join(productionDir, 'control.json');
const deliveryPath = path.join(productionDir, 'delivery-report.json');
const [control, deliveryReport] = await Promise.all([
  readJsonFile(controlPath, 'production/control.json'),
  readJsonFile(deliveryPath, 'production/delivery-report.json'),
]);
assertControl(control);

await writeJsonFile(path.join(productionDir, 'compiled-motion-plan.json'), compiledPlan);
for (const check of ['sourceFingerprint', 'hyperframesLint', 'hyperframesValidate', 'hyperframesInspect', 'animationMap', 'render', 'mediaProbe', 'contactSheet', 'styleProof', 'reviewScaffold']) {
  if (deliveryReport.checks[check] === 'passed') {
    deliveryReport.checks[check] = 'stale';
  }
}
deliveryReport.checks.compiledMotionPlan = 'passed';
deliveryReport.evidence = {
  ...(deliveryReport.evidence ?? {}),
  compiledMotionPlan: {
    path: 'production/compiled-motion-plan.json',
    planningFingerprint: compiledPlan.planningFingerprint,
  },
};
if (deliveryReport.status === 'passed') {
  deliveryReport.status = 'partial';
}
await writeJsonFile(deliveryPath, deliveryReport);

if (control.stage === 'plan') {
  await writeJsonFile(
    controlPath,
    advanceControl(control, 'build', 'compiled-motion-plan', 'Planning inputs compiled into the deterministic motion plan.'),
  );
}

console.log(`Compiled ${compiledPlan.beats.length} beats for ${compiledPlan.projectId}.`);
console.log(`Planning fingerprint: ${compiledPlan.planningFingerprint}`);
console.log(`Style-proof targets: ${compiledPlan.styleProofTargets.map((target) => target.beatId).join(', ')}`);
