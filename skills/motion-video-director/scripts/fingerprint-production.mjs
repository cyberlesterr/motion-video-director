#!/usr/bin/env node

import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {assertProjectRelativePath, createRuntimeFingerprint, readJsonFile, writeJsonFile} from './production-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.project) {
  console.log('Usage: node fingerprint-production.mjs <project-directory> [--out production/runtime-fingerprint.json] [--check]');
  process.exit(1);
}

const projectDir = path.resolve(args.project);
const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRelativePath = args.out ?? 'production/runtime-fingerprint.json';
const outputPath = assertProjectRelativePath(projectDir, outputRelativePath, '--out');
const fingerprint = await createRuntimeFingerprint(projectDir, skillRoot);

if (args.check) {
  const recorded = await readJsonFile(outputPath, outputRelativePath);
  if (recorded.fingerprint !== fingerprint.fingerprint) {
    throw new Error(`Stale runtime fingerprint at ${outputPath}; rerun fingerprint-production.mjs after updating source or Skill runtime.`);
  }
  console.log(`PASS runtime fingerprint: ${fingerprint.fingerprint}`);
} else {
  await writeJsonFile(outputPath, fingerprint);
  const deliveryPath = path.join(projectDir, 'production', 'delivery-report.json');
  const deliveryReport = await readJsonFile(deliveryPath, 'production/delivery-report.json');
  deliveryReport.checks.sourceFingerprint = 'passed';
  deliveryReport.evidence = {
    ...(deliveryReport.evidence ?? {}),
    sourceFingerprint: {
      path: outputRelativePath,
      value: fingerprint.fingerprint,
    },
  };
  await writeJsonFile(deliveryPath, deliveryReport);
  console.log(`Wrote runtime fingerprint: ${fingerprint.fingerprint}`);
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[index + 1];
      result[key] = next && !next.startsWith('--') ? argv[++index] : true;
    } else if (!result.project) {
      result.project = value;
    } else {
      throw new Error(`Unexpected argument: ${value}`);
    }
  }
  return result;
}
