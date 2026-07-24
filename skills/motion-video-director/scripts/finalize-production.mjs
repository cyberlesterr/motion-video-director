#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {advanceControl, assert, readJsonFile, writeJsonFile} from './production-lib.mjs';

const [projectArgument] = process.argv.slice(2);
if (!projectArgument || projectArgument === '--help' || projectArgument === '-h') {
  console.log('Usage: node finalize-production.mjs <project-directory>');
  process.exit(projectArgument ? 0 : 1);
}

const projectDir = path.resolve(process.cwd(), projectArgument);
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionDir = path.join(projectDir, 'production');
const deliveryPath = path.join(productionDir, 'delivery-report.json');
const controlPath = path.join(productionDir, 'control.json');
const [deliveryReport, control] = await Promise.all([
  readJsonFile(deliveryPath, 'production/delivery-report.json'),
  readJsonFile(controlPath, 'production/control.json'),
]);
assert(control.stage === 'review', `finalize-production.mjs requires review stage, found ${control.stage}.`);
const originalStatus = deliveryReport.status;
deliveryReport.status = 'passed';
await writeJsonFile(deliveryPath, deliveryReport);
try {
  await run(process.execPath, [path.join(skillRoot, 'scripts', 'verify-contract.mjs'), projectDir], projectDir);
} catch (error) {
  deliveryReport.status = originalStatus;
  await writeJsonFile(deliveryPath, deliveryReport);
  throw error;
}
await writeJsonFile(
  controlPath,
  advanceControl(control, 'complete', 'completed-production', 'All required delivery evidence is current and the contract passed.'),
);
console.log(`Finalized production: ${projectDir}`);

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
