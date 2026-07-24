#!/usr/bin/env node

import {mkdir, stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(currentDir, '..');
const referencePuppeteerPackage = path.resolve(projectDir, '..', 'paper-collage-video-promo', 'node_modules', 'puppeteer', 'package.json');

try {
  await stat(referencePuppeteerPackage);
} catch {
  throw new Error(`A local Puppeteer runtime is required at ${referencePuppeteerPackage}. This capture script never installs dependencies.`);
}

const require = createRequire(referencePuppeteerPackage);
const puppeteer = require('puppeteer');
const source = path.join(currentDir, 'styleframes.html');
const outputDir = path.join(currentDir, 'styleframes');
const styleframes = ['sf-01', 'sf-02', 'sf-03', 'sf-04', 'sf-05'];

await mkdir(outputDir, {recursive: true});
const browser = await puppeteer.launch({headless: true});

try {
  const page = await browser.newPage();
  await page.setViewport({width: 1080, height: 1920, deviceScaleFactor: 1});
  await page.goto(pathToFileURL(source).href, {waitUntil: 'networkidle0'});
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  for (const id of styleframes) {
    const element = await page.$(`#${id}`);
    if (!element) throw new Error(`Missing styleframe selector: #${id}`);
    await element.screenshot({path: path.join(outputDir, `${id}.png`)});
  }
} finally {
  await browser.close();
}

console.log(`Captured ${styleframes.length} styleframes to ${outputDir}`);
