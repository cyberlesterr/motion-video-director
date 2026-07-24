#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

const target = path.resolve(process.cwd(), process.argv[2] ?? '.');
const requiredFiles = ['DESIGN.md', 'index.html', 'project.json'];

async function readRequired(relativePath) {
  const filePath = path.join(target, relativePath);
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    throw new Error(`Missing required project file: ${filePath}`);
  }
}

const [design, html, projectText] = await Promise.all(requiredFiles.map(readRequired));
const project = JSON.parse(projectText);

const htmlRequirements = [
  'data-composition-id=',
  'data-start=',
  'data-duration=',
  'data-track-index=',
  'window.__timelines',
  'gsap.timeline({paused: true})',
];

const missingHtmlRequirements = htmlRequirements.filter((requirement) => !html.includes(requirement));

if (!/^#\s+Design/i.test(design)) {
  throw new Error('DESIGN.md must start with a Design heading.');
}

for (const heading of ['## Style Prompt', '## Colors', '## Typography', '## What Not To Do']) {
  if (!design.includes(heading)) {
    throw new Error(`DESIGN.md is missing required section: ${heading}`);
  }
}

if (!project.id || !Number.isInteger(project.width) || !Number.isInteger(project.height)) {
  throw new Error('project.json must include id plus integer width and height.');
}

if (![24, 30, 60].includes(project.fps) || !(project.durationSeconds > 0)) {
  throw new Error('project.json must use fps 24, 30, or 60 and a positive durationSeconds.');
}

if (missingHtmlRequirements.length > 0) {
  throw new Error(`index.html is missing HyperFrames contract: ${missingHtmlRequirements.join(', ')}`);
}

for (const forbidden of [/Math\.random\s*\(/, /Date\.now\s*\(/, /repeat\s*:\s*-1/]) {
  if (forbidden.test(html)) {
    throw new Error(`index.html contains a non-deterministic or non-renderable pattern: ${forbidden}`);
  }
}

console.log(`PASS motion-video-director source contract: ${target}`);
console.log(`Composition ${project.id}: ${project.width}x${project.height}, ${project.fps}fps, ${project.durationSeconds}s`);
console.log('This check does not replace HyperFrames lint, validate, inspect, or a rendered visual review.');
