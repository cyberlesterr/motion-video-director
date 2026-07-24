#!/usr/bin/env node

import {access, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const args = parseArgs(process.argv.slice(2));

if (!args.composition) {
  die('missing <composition-dir>');
}

const composition = path.resolve(args.composition);
const output = path.resolve(args.out ?? '.hyperframes/animation-map');
const frames = positiveNumber(args.frames, 6, '--frames');
const width = positiveNumber(args.width, 1920, '--width');
const height = positiveNumber(args.height, 1080, '--height');
const fps = positiveNumber(args.fps, 30, '--fps');
const minDuration = nonNegativeNumber(args['min-duration'], 0.15, '--min-duration');
const producerRoot = path.resolve(
  args['producer-root'] ?? path.join(composition, 'node_modules', '@hyperframes', 'producer'),
);
const producerEntry = path.join(producerRoot, 'dist', 'index.js');

await requireFile(
  producerEntry,
  `could not load @hyperframes/producer from ${producerRoot}. Run \`npm install --save-dev @hyperframes/producer@0.7.70\` in the composition directory, or pass --producer-root <path>.`,
);

const {
  createCaptureSession,
  createFileServer,
  closeCaptureSession,
  getCompositionDuration,
  initializeSession,
} = await import(pathToFileURL(producerEntry).href);

await mkdir(output, {recursive: true});

const server = await createFileServer({projectDir: composition, port: 0});
const session = await createCaptureSession(
  server.url,
  output,
  {width, height, fps, format: 'png'},
  null,
);

await initializeSession(session);

try {
  const duration = await getCompositionDuration(session);
  const allTweens = await enumerateTweens(session);
  const mapped = allTweens.filter((tween) => tween.end - tween.start >= minDuration);
  const report = {
    schemaVersion: 1,
    composition,
    producerRoot,
    viewport: {width, height, fps},
    duration: round(duration),
    totalTweens: allTweens.length,
    mappedTweens: mapped.length,
    skippedMicroTweens: allTweens.length - mapped.length,
    tweens: [],
  };

  for (const tween of mapped) {
    const samples = sampleTimes(tween.start, tween.end, frames);
    const bboxes = [];

    for (const time of samples) {
      await seekTo(session, time);
      bboxes.push({t: time, ...(await measureTarget(session, tween.selector))});
    }

    const flags = computeFlags(tween, bboxes, {width, height});
    report.tweens.push({
      ...tween,
      start: round(tween.start),
      end: round(tween.end),
      duration: round(tween.end - tween.start),
      bboxes,
      flags,
      summary: describeTween(tween, bboxes, flags),
    });
  }

  await markPotentialCollisions(session, report.tweens);
  report.density = computeDensity(report.tweens, duration);
  report.deadZones = findDeadZones(report.density, duration);
  report.elements = buildElementLifecycles(report.tweens);
  report.snapshots = await captureSnapshots(session, report.tweens, duration);

  await writeFile(path.join(output, 'animation-map.json'), `${JSON.stringify(report, null, 2)}\n`);
  printSummary(report);
} finally {
  await closeCaptureSession(session).catch(() => {});
  server.close();
}

async function requireFile(file, message) {
  try {
    await access(file);
  } catch {
    die(message);
  }
}

async function seekTo(session, time) {
  await session.page.evaluate((targetTime) => {
    if (window.__hf && typeof window.__hf.seek === 'function') {
      window.__hf.seek(targetTime);
      return;
    }

    for (const timeline of Object.values(window.__timelines ?? {})) {
      if (typeof timeline.seek === 'function') {
        timeline.seek(targetTime);
      }
    }
  }, time);
  await new Promise((resolve) => setTimeout(resolve, 80));
}

async function enumerateTweens(session) {
  return session.page.evaluate(() => {
    const ignoredProps = new Set([
      'delay',
      'duration',
      'ease',
      'immediateRender',
      'onComplete',
      'onStart',
      'onUpdate',
      'overwrite',
      'parent',
      'repeat',
      'runBackwards',
      'stagger',
      'yoyo',
    ]);

    const selectorFor = (element) => {
      if (!element || !(element instanceof Element)) {
        return null;
      }
      if (element.id) {
        return `#${element.id}`;
      }
      if (element.dataset.animationId) {
        return `[data-animation-id="${element.dataset.animationId}"]`;
      }
      const classes = [...element.classList].slice(0, 2).join('.');
      return classes ? `${element.tagName.toLowerCase()}.${classes}` : element.tagName.toLowerCase();
    };

    const results = [];
    const walk = (timeline, offset = 0) => {
      if (!timeline || typeof timeline.getChildren !== 'function') {
        return;
      }

      const directChildren = timeline.getChildren(false, true, true);
      for (const child of directChildren) {
        const start = offset + (child.startTime?.() ?? 0);
        if (typeof child.getChildren === 'function') {
          walk(child, start);
          continue;
        }

        const targets = (child.targets?.() ?? []).filter((target) => target instanceof Element);
        if (!targets.length) {
          continue;
        }

        const vars = child.vars ?? {};
        results.push({
          selector: selectorFor(targets[0]) ?? '(unknown)',
          targetCount: targets.length,
          props: Object.keys(vars).filter((key) => !ignoredProps.has(key)),
          start,
          end: start + (child.duration?.() ?? 0),
          ease: typeof vars.ease === 'string' ? vars.ease : (vars.ease?.toString?.() ?? 'none'),
        });
      }
    };

    for (const timeline of Object.values(window.__timelines ?? {})) {
      walk(timeline);
    }

    return results.sort((left, right) => left.start - right.start || left.end - right.end);
  });
}

async function measureTarget(session, selector) {
  return session.page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector);
    if (!element) {
      return {missing: true, x: 0, y: 0, w: 0, h: 0, opacity: 0, visible: false};
    }

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      opacity: Math.round(parseFloat(style.opacity) * 1000) / 1000,
      visible: style.display !== 'none' && style.visibility !== 'hidden',
    };
  }, selector);
}

function sampleTimes(start, end, count) {
  return Array.from(
    {length: count},
    (_, index) => round(start + ((index + 0.5) / count) * (end - start)),
  );
}

function computeFlags(tween, bboxes, viewport) {
  const flags = [];
  const duration = tween.end - tween.start;
  const allDegenerate = bboxes.every((box) => box.w === 0 || box.h === 0);
  const offscreen = bboxes.some(
    (box) =>
      box.x + box.w <= 0 ||
      box.y + box.h <= 0 ||
      box.x >= viewport.width ||
      box.y >= viewport.height ||
      box.x < -box.w * 0.5 ||
      box.y < -box.h * 0.5 ||
      box.x + box.w > viewport.width + box.w * 0.5 ||
      box.y + box.h > viewport.height + box.h * 0.5,
  );
  const alwaysInvisible = bboxes.every((box) => box.visible && box.opacity < 0.01);

  if (allDegenerate) flags.push('degenerate');
  if (offscreen) flags.push('offscreen');
  if (alwaysInvisible) flags.push('invisible');
  if (duration < 0.2 && tween.props.some((prop) => ['opacity', 'scale', 'x', 'y'].includes(prop))) {
    flags.push('paced-fast');
  }
  if (duration > 2) flags.push('paced-slow');

  return flags;
}

function describeTween(tween, bboxes, flags) {
  const first = bboxes[0];
  const last = bboxes.at(-1);
  const parts = [
    `${tween.selector} animates ${tween.props.join('+') || 'timeline state'} over ${(tween.end - tween.start).toFixed(2)}s (${tween.ease})`,
  ];

  if (first && last) {
    const deltaX = last.x - first.x;
    const deltaY = last.y - first.y;
    const directions = [];
    if (Math.abs(deltaX) > 3) directions.push(`${Math.abs(deltaX)}px ${deltaX < 0 ? 'left' : 'right'}`);
    if (Math.abs(deltaY) > 3) directions.push(`${Math.abs(deltaY)}px ${deltaY < 0 ? 'up' : 'down'}`);
    if (directions.length) parts.push(`moves ${directions.join(' and ')}`);
    if (Math.abs(last.opacity - first.opacity) > 0.1) {
      parts.push(`opacity ${first.opacity.toFixed(1)}→${last.opacity.toFixed(1)}`);
    }
    if (last.w !== first.w || last.h !== first.h) {
      parts.push(`bounds ${first.w}×${first.h}→${last.w}×${last.h}`);
    }
  }
  if (flags.length) parts.push(`flags: ${flags.join(', ')}`);
  return `${parts.join('. ')}.`;
}

async function markPotentialCollisions(session, tweens) {
  for (let leftIndex = 0; leftIndex < tweens.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < tweens.length; rightIndex += 1) {
      const left = tweens[leftIndex];
      const right = tweens[rightIndex];
      if (left.end <= right.start || right.end <= left.start) {
        continue;
      }
      if (left.selector === right.selector || (await selectorsShareHierarchy(session, left.selector, right.selector))) {
        continue;
      }

      const collision = left.bboxes.some((leftBox) => {
        const rightBox = right.bboxes.find((candidate) => Math.abs(candidate.t - leftBox.t) <= 0.12);
        return rightBox && overlapRatio(leftBox, rightBox) > 0.3;
      });

      if (collision) {
        for (const tween of [left, right]) {
          if (!tween.flags.includes('collision')) tween.flags.push('collision');
        }
      }
    }
  }
}

async function selectorsShareHierarchy(session, leftSelector, rightSelector) {
  return session.page.evaluate(({left, right}) => {
    const leftElement = document.querySelector(left);
    const rightElement = document.querySelector(right);
    return Boolean(
      leftElement && rightElement && (leftElement.contains(rightElement) || rightElement.contains(leftElement)),
    );
  }, {left: leftSelector, right: rightSelector});
}

function overlapRatio(left, right) {
  const x1 = Math.max(left.x, right.x);
  const y1 = Math.max(left.y, right.y);
  const x2 = Math.min(left.x + left.w, right.x + right.w);
  const y2 = Math.min(left.y + left.h, right.y + right.h);
  const overlap = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area = left.w * left.h;
  return area > 0 ? overlap / area : 0;
}

function computeDensity(tweens, duration) {
  const density = [];
  for (let time = 0; time < duration; time += 0.5) {
    density.push({
      t: round(time),
      activeTweens: tweens.filter((tween) => tween.start <= time + 0.5 && tween.end >= time).length,
    });
  }
  return density;
}

function findDeadZones(density, duration) {
  const zones = [];
  let start = null;

  for (const bucket of density) {
    if (bucket.activeTweens === 0) {
      start ??= bucket.t;
      continue;
    }
    if (start !== null && bucket.t - start >= 1) {
      zones.push({start, end: bucket.t, duration: round(bucket.t - start)});
    }
    start = null;
  }

  if (start !== null && duration - start >= 1) {
    zones.push({start, end: round(duration), duration: round(duration - start)});
  }
  return zones;
}

function buildElementLifecycles(tweens) {
  const elements = {};
  for (const tween of tweens) {
    const current = elements[tween.selector] ?? {
      firstAnimates: tween.start,
      lastAnimates: tween.end,
      tweenCount: 0,
      props: new Set(),
    };
    current.firstAnimates = Math.min(current.firstAnimates, tween.start);
    current.lastAnimates = Math.max(current.lastAnimates, tween.end);
    current.tweenCount += 1;
    tween.props.forEach((prop) => current.props.add(prop));
    elements[tween.selector] = current;
  }

  return Object.fromEntries(
    Object.entries(elements).map(([selector, element]) => [
      selector,
      {
        firstAnimates: round(element.firstAnimates),
        lastAnimates: round(element.lastAnimates),
        tweenCount: element.tweenCount,
        props: [...element.props],
      },
    ]),
  );
}

async function captureSnapshots(session, tweens, duration) {
  const times = [0, duration * 0.25, duration * 0.5, duration * 0.75, Math.max(0, duration - 0.1)];
  const snapshots = [];

  for (const time of times) {
    await seekTo(session, time);
    const visibleElements = await session.page.evaluate(() => {
      const elements = [];
      for (const element of document.querySelectorAll('[id], [data-animation-id]')) {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.01) continue;
        if (rect.width < 1 || rect.height < 1) continue;
        elements.push({
          selector: element.id ? `#${element.id}` : `[data-animation-id="${element.dataset.animationId}"]`,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
      return elements;
    });

    snapshots.push({
      t: round(time),
      visibleElements,
      animatingNow: tweens.filter((tween) => tween.start <= time && tween.end >= time).map((tween) => tween.selector),
    });
  }
  return snapshots;
}

function printSummary(report) {
  const flagCounts = {};
  for (const tween of report.tweens) {
    for (const flag of tween.flags) flagCounts[flag] = (flagCounts[flag] ?? 0) + 1;
  }

  console.log(`Animation map: ${report.mappedTweens}/${report.totalTweens} tweens (${report.duration}s).`);
  console.log(`Output: ${path.join(output, 'animation-map.json')}`);
  if (Object.keys(flagCounts).length) {
    console.log(`Flags: ${Object.entries(flagCounts).map(([flag, count]) => `${flag}=${count}`).join(', ')}.`);
  }
  if (report.deadZones.length) {
    console.log(`Dead zones: ${report.deadZones.map((zone) => `${zone.start}-${zone.end}s`).join(', ')}.`);
  }
}

function parseArgs(argv) {
  const output = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[index + 1];
      output[key] = next && !next.startsWith('--') ? argv[++index] : true;
    } else if (!output.composition) {
      output.composition = value;
    } else {
      die(`unexpected argument: ${value}`);
    }
  }
  return output;
}

function positiveNumber(value, fallback, flag) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number <= 0) die(`${flag} must be a positive number`);
  return number;
}

function nonNegativeNumber(value, fallback, flag) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number < 0) die(`${flag} must be a non-negative number`);
  return number;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function die(message) {
  console.error(`animation-map: ${message}`);
  process.exit(2);
}
