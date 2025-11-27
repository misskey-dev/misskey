/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import cssnano from 'cssnano';
import * as yaml from 'js-yaml';
import postcss from 'postcss';
import * as terser from 'terser';

import generateDTS from '../locales/generateDTS.js';
import meta from '../package.json' with { type: "json" };
import { dirname, resolve } from "node:path";

const configDir = fileURLToPath(new URL('../.config', import.meta.url));
const configPath = process.env.MISSKEY_CONFIG_YML
	? path.resolve(configDir, process.env.MISSKEY_CONFIG_YML)
	: process.env.NODE_ENV === 'test'
		? path.resolve(configDir, 'test.yml')
		: path.resolve(configDir, 'default.yml');

export async function loadConfig() {
	return fs.readFile(configPath, 'utf-8').then(data => yaml.load(data)).catch(() => null);
}

export async function copyFrontendFonts() {
  await fs.cp('./packages/frontend/node_modules/three/examples/fonts', './built/_frontend_dist_/fonts', { dereference: true, recursive: true });
}

export async function copyFrontendLocales(locales) {
  generateDTS();

  await fs.mkdir('./built/_frontend_dist_/locales', { recursive: true });

  const v = { '_version_': meta.version };

  for (const [lang, locale] of Object.entries(locales)) {
    await fs.writeFile(`./built/_frontend_dist_/locales/${lang}.${meta.version}.json`, JSON.stringify({ ...locale, ...v }), 'utf-8');
  }
}

export async function copyBackendViews(basedir) {
	await fs.mkdir(resolve(basedir, `./packages/backend/built/boot`), { recursive: true });
  await fs.cp(resolve(basedir, './packages/backend/src/server/web/views',), resolve(basedir, './packages/backend/built/boot/views'), { recursive: true });
}

export async function buildBackendScript(basedir, locales) {
  await fs.mkdir('./packages/backend/built/server/web', { recursive: true });

  for (const file of [
    './packages/backend/src/server/web/boot.js',
    './packages/backend/src/server/web/boot.embed.js',
    './packages/backend/src/server/web/bios.js',
    './packages/backend/src/server/web/cli.js',
    './packages/backend/src/server/web/error.js',
  ]) {
    let source = await fs.readFile(resolve(basedir, file), { encoding: 'utf-8' });
    source = source.replaceAll('LANGS', JSON.stringify(Object.keys(locales)));
    const { code } = await terser.minify(source, { toplevel: true });

		await fs.mkdir(resolve(basedir, `./packages/backend/built/boot`), { recursive: true });
    await fs.writeFile(resolve(basedir, `./packages/backend/built/boot/${path.basename(file)}`), code);
  }
}

export async function buildBackendStyle(basedir) {
  await fs.mkdir('./packages/backend/built/server/web', { recursive: true });

  for (const file of [
    './packages/backend/src/server/web/style.css',
    './packages/backend/src/server/web/style.embed.css',
    './packages/backend/src/server/web/bios.css',
    './packages/backend/src/server/web/cli.css',
    './packages/backend/src/server/web/error.css'
  ]) {
    const source = await fs.readFile(resolve(basedir, file), { encoding: 'utf-8' });
    const { css } = await postcss([cssnano({ zindex: false })]).process(source, { from: undefined });

		await fs.mkdir(resolve(basedir, `./packages/backend/built/boot`), { recursive: true });
    await fs.writeFile(resolve(basedir, `./packages/backend/built/boot/${path.basename(file)}`), css);
  }
}
