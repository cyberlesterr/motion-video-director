#!/usr/bin/env node

import path from 'node:path';
import {advanceControl, readJsonFile, writeJsonFile} from './production-lib.mjs';

const [projectArgument, nextStage, ...noteParts] = process.argv.slice(2);
if (!projectArgument || !nextStage || noteParts.length === 0 || projectArgument === '--help' || projectArgument === '-h') {
  console.log('Usage: node set-production-stage.mjs <project-directory> <next-stage> <note>');
  console.log('Stages advance in order: plan → build → validate → review → complete.');
  process.exit(projectArgument ? 0 : 1);
}

const projectDir = path.resolve(process.cwd(), projectArgument);
const controlPath = path.join(projectDir, 'production', 'control.json');
const control = await readJsonFile(controlPath, 'production/control.json');
const next = advanceControl(control, nextStage, 'stage-advanced', noteParts.join(' '));
await writeJsonFile(controlPath, next);
console.log(`Advanced ${projectDir} from ${control.stage} to ${next.stage}.`);
