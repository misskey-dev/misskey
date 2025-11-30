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
import { resolve } from "node:path";

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

/** @param {string} baseDir */
export async function copyBackendViews(baseDir) {
	const srcWebDir = resolve(baseDir, './packages/backend/src/server/web/views');
	const destWebDir = resolve(baseDir, './packages/backend/built/boot/views');
	await fs.cp(srcWebDir, destWebDir, { recursive: true });
}

/** @param {string} baseDir */
export async function buildBackendScript(baseDir) {
	const srcWebDir = resolve(baseDir, './packages/backend/src/server/web');
	const destWebDir = resolve(baseDir, './packages/backend/built/boot');
	await fs.mkdir(destWebDir, { recursive: true });

	for (const file of [
		`${srcWebDir}/boot.js`,
		`${srcWebDir}/boot.embed.js`,
		`${srcWebDir}/bios.js`,
		`${srcWebDir}/cli.js`,
		`${srcWebDir}/error.js`,
	]) {
		let source = await fs.readFile(file, { encoding: 'utf-8' });
		source = source.replaceAll('LANGS', JSON.stringify(Object.keys(locales)));
		const { code } = await terser.minify(source, { toplevel: true });
		await fs.writeFile(`${destWebDir}/${path.basename(file)}`, code);
	}
}

/** @param {string} baseDir */
export async function buildBackendStyle(baseDir) {
	const srcWebDir = resolve(baseDir, './packages/backend/src/server/web');
	const destWebDir = resolve(baseDir, './packages/backend/built/boot');
	await fs.mkdir(destWebDir, { recursive: true });

	for (const file of [
		`${srcWebDir}/style.css`,
		`${srcWebDir}/style.embed.css`,
		`${srcWebDir}/bios.css`,
		`${srcWebDir}/cli.css`,
		`${srcWebDir}/error.css`
	]) {
		const source = await fs.readFile(file, { encoding: 'utf-8' });
		const { css } = await postcss([cssnano({ zindex: false })]).process(source, { from: undefined });
		await fs.writeFile(`${destWebDir}/${path.basename(file)}`, css);
	}
}

async function build() {
	const baseDir = fileURLToPath(new URL('..', import.meta.url));
	await Promise.all([
		copyFrontendFonts(),
		copyBackendViews(baseDir),
		buildBackendScript(baseDir),
		buildBackendStyle(baseDir),
		loadConfig().then(config => config?.publishTarballInsteadOfProvideRepositoryUrl && buildTarball()),
	]);
}

// スクリプトとして直接実行された場合
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
	await build();
}
