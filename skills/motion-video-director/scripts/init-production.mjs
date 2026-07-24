#!/usr/bin/env node

import {cp, mkdir, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const currentFile = fileURLToPath(import.meta.url);
const skillRoot = path.resolve(path.dirname(currentFile), '..');
const starter = path.join(skillRoot, 'assets', 'hyperframes-starter');
const contract = path.join(skillRoot, 'assets', 'project-contract');
const [targetArgument] = process.argv.slice(2);

if (!targetArgument || targetArgument === '--help' || targetArgument === '-h') {
  console.log('Usage: node init-production.mjs <empty-project-directory>');
  console.log('Creates a deterministic starter and its production planning contract.');
  process.exit(targetArgument ? 0 : 1);
}

if (process.argv.length !== 3) {
  throw new Error('Usage: node init-production.mjs <empty-project-directory>');
}

const target = path.resolve(process.cwd(), targetArgument);
let entries = [];

try {
  entries = await readdir(target);
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}

if (entries.length > 0) {
  throw new Error(`Refusing to overwrite non-empty directory: ${target}`);
}

async function copyContents(source, destination) {
  await mkdir(destination, {recursive: true});

  for (const entry of await readdir(source)) {
    await cp(path.join(source, entry), path.join(destination, entry), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  }
}

await copyContents(starter, target);
await copyContents(contract, path.join(target, 'production'));
await mkdir(path.join(target, 'assets'), {recursive: true});

console.log(`Initialized motion-video-director starter at ${target}`);
console.log('Update DESIGN.md and production/{brief,source-dossier,beat-graph,asset-manifest,proof-plan}.json before editing the composition.');
console.log('The generated project is status=starter, not a completed production.');
console.log('Run verify-contract.mjs now, then run HyperFrames lint, validate, inspect, and render when the CLI is available.');
