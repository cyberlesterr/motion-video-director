#!/usr/bin/env node

import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {assertControl, readJsonFile} from './production-lib.mjs';

const [projectArgument] = process.argv.slice(2);
if (!projectArgument || projectArgument === '--help' || projectArgument === '-h') {
  console.log('Usage: node resume-production.mjs <project-directory>');
  process.exit(projectArgument ? 0 : 1);
}

const projectDir = path.resolve(process.cwd(), projectArgument);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const control = await readJsonFile(path.join(projectDir, 'production', 'control.json'), 'production/control.json');
assertControl(control);

const commands = {
  plan: `node ${path.join(scriptDir, 'compile-motion-plan.mjs')} ${projectDir}`,
  build: 'Build the static hero state, then add the paused GSAP timeline and preserve the compiled proof times.',
  validate: `node ${path.join(scriptDir, 'verify-contract.mjs')} ${projectDir}`,
  review: `node ${path.join(scriptDir, 'review-scaffold.mjs')} ${projectDir}`,
  complete: 'No production command is pending. Deliver only the recorded local artifacts unless the user requests a revision.',
};

console.log(`Stage: ${control.stage}`);
console.log(`Last event: ${control.events.at(-1).action} — ${control.events.at(-1).note}`);
console.log(`Next: ${commands[control.stage]}`);
