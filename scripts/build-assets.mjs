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

import { locales } from 'i18n';
import buildTarball from './tarball.mjs';

const configDir = fileURLToPath(new URL('../.config', import.meta.url));
const configPath = process.env.MISSKEY_CONFIG_YML
	? path.resolve(configDir, process.env.MISSKEY_CONFIG_YML)
	: process.env.NODE_ENV === 'test'
		? path.resolve(configDir, 'test.yml')
		: path.resolve(configDir, 'default.yml');

async function loadConfig() {
	return fs.readFile(configPath, 'utf-8').then(data => yaml.load(data)).catch(() => null);
}

async function copyFrontendFonts() {
	await fs.cp('./packages/frontend/node_modules/three/examples/fonts', './built/_frontend_dist_/fonts', { dereference: true, recursive: true });
}

async function copyBackendViews() {
	await fs.cp('./packages/backend/src/server/web/views', './packages/backend/built/server/web/views', { recursive: true });
}

async function buildBackendScript() {
	await fs.mkdir('./packages/backend/built/server/web', { recursive: true });

	for (const file of [
		'./packages/backend/src/server/web/boot.js',
		'./packages/backend/src/server/web/boot.embed.js',
		'./packages/backend/src/server/web/bios.js',
		'./packages/backend/src/server/web/cli.js',
		'./packages/backend/src/server/web/error.js',
	]) {
		let source = await fs.readFile(file, { encoding: 'utf-8' });
		source = source.replaceAll('LANGS', JSON.stringify(Object.keys(locales)));
		const { code } = await terser.minify(source, { toplevel: true });
		await fs.writeFile(`./packages/backend/built/server/web/${path.basename(file)}`, code);
	}
}

async function buildBackendStyle() {
	await fs.mkdir('./packages/backend/built/server/web', { recursive: true });

	for (const file of [
		'./packages/backend/src/server/web/style.css',
		'./packages/backend/src/server/web/style.embed.css',
		'./packages/backend/src/server/web/bios.css',
		'./packages/backend/src/server/web/cli.css',
		'./packages/backend/src/server/web/error.css'
	]) {
		const source = await fs.readFile(file, { encoding: 'utf-8' });
		const { css } = await postcss([cssnano({ zindex: false })]).process(source, { from: undefined });
		await fs.writeFile(`./packages/backend/built/server/web/${path.basename(file)}`, css);
	}
}

async function build() {
	await Promise.all([
		copyFrontendFonts(),
		copyBackendViews(),
		buildBackendScript(),
		buildBackendStyle(),
		loadConfig().then(config => config?.publishTarballInsteadOfProvideRepositoryUrl && buildTarball()),
	]);
}

await build();
