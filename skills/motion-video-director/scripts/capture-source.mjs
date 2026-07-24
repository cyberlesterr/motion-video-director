#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {
  assert,
  fileRecord,
  isNonEmptyString,
  pathExists,
  readJsonFile,
  writeJsonFile,
} from './production-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.project || !args.type || !args.url) {
  console.log('Usage: node capture-source.mjs <project-directory> --type <website|github> --url <https-url> [--usage <commentary|authorized-promotion>] [--skip-page-capture]');
  process.exit(1);
}

assert(['website', 'github'].includes(args.type), '--type must be website or github.');
assert(!args.skipPageCapture || args.type === 'github', '--skip-page-capture is only available for the GitHub route.');
const usage = args.usage ?? 'commentary';
assert(['commentary', 'authorized-promotion'].includes(usage), '--usage must be commentary or authorized-promotion.');

const projectDir = path.resolve(args.project);
const productionDir = path.join(projectDir, 'production');
const captureDir = path.join(projectDir, 'capture');
const [brief, sourceDossier, control, deliveryReport] = await Promise.all([
  readJsonFile(path.join(productionDir, 'brief.json'), 'production/brief.json'),
  readJsonFile(path.join(productionDir, 'source-dossier.json'), 'production/source-dossier.json'),
  readJsonFile(path.join(productionDir, 'control.json'), 'production/control.json'),
  readJsonFile(path.join(productionDir, 'delivery-report.json'), 'production/delivery-report.json'),
]);

assert(control.stage === 'plan', 'Capture the source during the plan stage. Reopen or create a new project before replacing an existing source dossier.');
assert(sourceDossier.status === 'not-captured' && sourceDossier.source?.route === 'local-brief', 'Refusing to replace an existing source dossier. Create a new project for another source capture.');
const stagingDir = await prepareStagingDirectory(projectDir, captureDir);
let result;
try {
  if (args.type === 'website') {
    const canonicalUrl = normalizeWebsiteUrl(args.url);
    await capturePage(projectDir, canonicalUrl, stagingDir);
    await assertPageCapture(stagingDir);
    await rename(stagingDir, captureDir);
    const artifacts = await collectArtifacts(projectDir, captureDir, 'website-capture');
    const facts = await websiteFacts(projectDir);
    result = {
      canonicalUrl,
      artifacts,
      facts,
      summary: {
        capturedFileCount: artifacts.length,
        screenshotCount: artifacts.filter((artifact) => /(^|\/)screenshots\//.test(artifact.path)).length,
        extractedTextFound: artifacts.some((artifact) => artifact.path.endsWith('/visible-text.txt')),
      },
    };
  } else {
    result = await captureGitHub(projectDir, stagingDir, args.url, !args.skipPageCapture);
    if (result.pageCaptureIncluded) {
      await assertPageCapture(path.join(stagingDir, 'site'));
    }
    await rename(stagingDir, captureDir);
    const artifacts = await collectArtifacts(projectDir, captureDir, 'github-capture');
    result = {
      ...result,
      artifacts,
      facts: githubFacts(result.repositorySnapshot, result.commitSnapshot, result.hasReadme),
      summary: {
        fullName: result.repositorySnapshot.full_name,
        defaultBranch: result.repositorySnapshot.default_branch,
        defaultBranchCommit: result.commitSnapshot.sha,
        license: result.repositorySnapshot.license?.spdx_id ?? null,
        topics: Array.isArray(result.repositorySnapshot.topics) ? result.repositorySnapshot.topics : [],
        pageCaptureIncluded: result.pageCaptureIncluded,
        rawArtifactCount: artifacts.length,
      },
    };
  }
} catch (error) {
  await rm(stagingDir, {recursive: true, force: true});
  throw error;
}

const capturedAt = new Date().toISOString();
const nextDossier = {
  schemaVersion: 1,
  status: 'captured',
  source: {
    route: args.type,
    canonicalUrl: result.canonicalUrl,
    capturedAt,
    usage,
  },
  capture: {
    directory: 'capture',
    artifacts: result.artifacts,
  },
  facts: result.facts,
  assetCandidates: [],
  summary: result.summary,
};

brief.sourceRoute = args.type;
for (const check of ['sourceFingerprint', 'hyperframesLint', 'hyperframesValidate', 'hyperframesInspect', 'animationMap', 'render', 'mediaProbe', 'contactSheet', 'styleProof', 'reviewScaffold']) {
  if (deliveryReport.checks[check] === 'passed') {
    deliveryReport.checks[check] = 'stale';
  }
}
deliveryReport.checks.sourceContract = 'not-run';
deliveryReport.checks.compiledMotionPlan = deliveryReport.checks.compiledMotionPlan === 'passed' ? 'stale' : 'not-run';
if (deliveryReport.status === 'passed') {
  deliveryReport.status = 'partial';
}

await Promise.all([
  writeJsonFile(path.join(productionDir, 'brief.json'), brief),
  writeJsonFile(path.join(productionDir, 'source-dossier.json'), nextDossier),
  writeJsonFile(path.join(productionDir, 'delivery-report.json'), deliveryReport),
]);

console.log(`Captured ${args.type} source: ${result.canonicalUrl}`);
console.log(`Raw artifacts: ${result.artifacts.length}; source facts: ${result.facts.length}.`);
console.log('Next: inspect production/source-dossier.json, obtain approval for the thesis/script/storyboard, then compile the motion plan.');

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      assert(!parsed.project, `Unexpected argument: ${value}`);
      parsed.project = value;
      continue;
    }

    const key = value.slice(2);
    assert(['type', 'url', 'usage', 'skip-page-capture'].includes(key), `Unsupported option: ${value}`);
    if (key === 'skip-page-capture') {
      assert(!parsed.skipPageCapture, '--skip-page-capture was supplied more than once.');
      parsed.skipPageCapture = true;
      continue;
    }
    const next = argv[index + 1];
    assert(next && !next.startsWith('--'), `${value} needs a value.`);
    assert(!parsed[key], `${value} was supplied more than once.`);
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function parseHttpsUrl(value, label) {
  assert(isNonEmptyString(value), `${label} must be a non-empty HTTPS URL.`);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL.`);
  }
  assert(url.protocol === 'https:', `${label} must use HTTPS.`);
  assert(!url.username && !url.password, `${label} must not include credentials.`);
  return url;
}

function normalizeWebsiteUrl(value) {
  const url = parseHttpsUrl(value, '--url');
  url.hash = '';
  return url.toString();
}

function normalizeGitHubUrl(value) {
  const url = parseHttpsUrl(value, '--url');
  assert(url.hostname === 'github.com' || url.hostname === 'www.github.com', '--url for a GitHub project must use github.com.');
  const parts = url.pathname.split('/').filter(Boolean);
  assert(parts.length >= 2, '--url for a GitHub project must include owner and repository.');
  const [owner, repository] = parts;
  assert(/^[A-Za-z0-9-]+$/.test(owner), 'GitHub owner contains unsupported characters.');
  assert(/^[A-Za-z0-9_.-]+$/.test(repository), 'GitHub repository contains unsupported characters.');
  return {
    owner,
    repository,
    canonicalUrl: `https://github.com/${owner}/${repository}`,
  };
}

async function prepareStagingDirectory(projectDir, captureDir) {
  assert(!(await pathExists(captureDir)), `Refusing to overwrite existing capture directory: ${captureDir}`);
  return mkdtemp(path.join(projectDir, '.source-capture-staging-'));
}

async function capturePage(projectDir, url, outputDir) {
  const localCli = path.join(projectDir, 'node_modules', '.bin', 'hyperframes');
  const command = await pathExists(localCli) ? localCli : 'npx';
  const commandArgs = await pathExists(localCli)
    ? ['capture', url, '-o', outputDir, '--timeout', '120000']
    : ['--yes', 'hyperframes@0.7.70', 'capture', url, '-o', outputDir, '--timeout', '120000'];
  console.log(`Capturing public page with ${command === 'npx' ? 'pinned HyperFrames 0.7.70' : 'the project-local HyperFrames CLI'} (120 second page timeout).`);
  await run(command, commandArgs, projectDir);
}

async function captureGitHub(projectDir, captureDir, sourceUrl, includePageCapture) {
  const {owner, repository, canonicalUrl} = normalizeGitHubUrl(sourceUrl);
  const githubDir = path.join(captureDir, 'github');
  await mkdir(githubDir, {recursive: true});

  const repositorySnapshot = await fetchGitHubJson(`https://api.github.com/repos/${owner}/${repository}`);
  await writeJsonFile(path.join(githubDir, 'repository.json'), repositorySnapshot);
  assert(isNonEmptyString(repositorySnapshot.default_branch), 'GitHub repository metadata does not include default_branch.');

  const commitSnapshot = await fetchGitHubJson(`https://api.github.com/repos/${owner}/${repository}/commits/${encodeURIComponent(repositorySnapshot.default_branch)}`);
  await writeJsonFile(path.join(githubDir, 'default-branch-commit.json'), commitSnapshot);
  assert(isNonEmptyString(commitSnapshot.sha), 'GitHub default-branch response does not include a commit SHA.');

  let readmeSnapshot;
  try {
    readmeSnapshot = await fetchGitHubJson(`https://api.github.com/repos/${owner}/${repository}/readme?ref=${encodeURIComponent(commitSnapshot.sha)}`);
    await writeJsonFile(path.join(githubDir, 'readme.json'), readmeSnapshot);
    if (isNonEmptyString(readmeSnapshot.content) && readmeSnapshot.encoding === 'base64') {
      await writeFile(path.join(githubDir, 'README.md'), Buffer.from(readmeSnapshot.content, 'base64'));
    }
  } catch (error) {
    if (error.status !== 404) throw error;
    console.log('GitHub repository has no readable README at the default-branch snapshot; continuing with repository metadata.');
  }

  if (includePageCapture) {
    await capturePage(projectDir, canonicalUrl, path.join(captureDir, 'site'));
  }

  return {
    canonicalUrl,
    repositorySnapshot,
    commitSnapshot,
    hasReadme: Boolean(readmeSnapshot),
    pageCaptureIncluded: includePageCapture,
  };
}

async function assertPageCapture(directory) {
  const files = await listFiles(directory);
  assert(files.some((filePath) => /(^|\/)screenshots\//.test(filePath)), 'HyperFrames capture did not produce a screenshot; source dossier was not written.');
}

async function fetchGitHubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'motion-video-director-source-capture',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) {
    const error = new Error(`GitHub API request failed (${response.status}) for ${url}.`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function collectArtifacts(projectDir, directory, scope) {
  const files = await listFiles(directory);
  const records = [];
  for (const filePath of files) {
    const relativePath = path.relative(projectDir, filePath).split(path.sep).join('/');
    records.push(await fileRecord(scope, relativePath, filePath));
  }
  return records.sort((left, right) => left.path.localeCompare(right.path));
}

async function listFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

async function websiteFacts(projectDir) {
  const visibleTextPath = path.join(projectDir, 'capture', 'extracted', 'visible-text.txt');
  if (!(await pathExists(visibleTextPath))) return [];
  const text = await readFile(visibleTextPath, 'utf8');
  const candidates = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const match = line.match(/\[h[1-3]\]\s*(.+)$/i);
    if (match?.[1]?.trim()) {
      candidates.push({line: index + 1, statement: match[1].trim()});
    }
  }
  return candidates.slice(0, 8).map((candidate, index) => ({
    id: `website-heading-${String(index + 1).padStart(2, '0')}`,
    statement: candidate.statement,
    sourcePath: 'capture/extracted/visible-text.txt',
    locator: `line ${candidate.line}`,
    verification: 'source-claimed',
  }));
}

function githubFacts(repositorySnapshot, commitSnapshot, hasReadme) {
  const facts = [{
    id: 'github-default-branch-snapshot',
    statement: `Default branch ${repositorySnapshot.default_branch} resolved to commit ${commitSnapshot.sha}.`,
    sourcePath: 'capture/github/default-branch-commit.json',
    locator: 'sha',
    verification: 'github-api-snapshot',
  }];
  if (isNonEmptyString(repositorySnapshot.description)) {
    facts.unshift({
      id: 'github-repository-description',
      statement: repositorySnapshot.description,
      sourcePath: 'capture/github/repository.json',
      locator: 'description',
      verification: 'github-api-snapshot',
    });
  }
  if (hasReadme) {
    facts.push({
      id: 'github-readme-present',
      statement: 'A README snapshot was retrieved at the default-branch commit.',
      sourcePath: 'capture/github/readme.json',
      locator: 'content',
      verification: 'github-api-snapshot',
    });
  }
  return facts;
}

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
