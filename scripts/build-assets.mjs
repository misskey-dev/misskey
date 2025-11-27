/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs/promises';

import { build as buildLocales } from '../locales/index.js';
import buildTarball from './tarball.mjs';
import {
	loadConfig,
	buildBackendScript,
	buildBackendStyle,
	copyBackendViews,
	copyFrontendFonts,
	copyFrontendLocales
} from "./build-assets-func.mjs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

let locales = buildLocales();

async function build() {
  await Promise.all([
    copyFrontendFonts(),
    copyFrontendLocales(locales),
    copyBackendViews(_dirname),
    buildBackendScript(_dirname, locales),
    buildBackendStyle(_dirname),
		loadConfig().then(config => config?.publishTarballInsteadOfProvideRepositoryUrl && buildTarball()),
  ]);
}

await build();

if (process.argv.includes('--watch')) {
	const watcher = fs.watch('./locales');
	for await (const event of watcher) {
		const filename = event.filename?.replaceAll('\\', '/');
		if (/^[a-z]+-[A-Z]+\.yml/.test(filename)) {
			console.log(`update ${filename} ...`)
			locales = buildLocales();
			await copyFrontendLocales()
		}
	}
}
