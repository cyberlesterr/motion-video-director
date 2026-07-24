#!/usr/bin/env node

import {cp, mkdir, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const currentFile = fileURLToPath(import.meta.url);
const skillRoot = path.resolve(path.dirname(currentFile), '..');
const starter = path.join(skillRoot, 'assets', 'hyperframes-starter');
const targetArgument = process.argv[2];

if (!targetArgument) {
  throw new Error('Usage: node bootstrap-project.mjs <empty-project-directory>');
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

await mkdir(target, {recursive: true});

for (const entry of await readdir(starter)) {
  await cp(path.join(starter, entry), path.join(target, entry), {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
}

console.log(`Bootstrapped HyperFrames fallback starter at ${target}`);
console.log('When the HyperFrames CLI is available, run lint, validate, inspect, and render from that directory.');
