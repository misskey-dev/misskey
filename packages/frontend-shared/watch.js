/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { watch, readFileSync } from 'node:fs';
import { build } from 'unbuild';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const _package = JSON.parse(readFileSync(_dirname + '/package.json', 'utf-8'));

async function watchSrc() {
	console.log(`[${_package.name}] start watching...`);

	let isBuilding = false;
	let needsRebuild = false;

	const watcher = watch('./js', { recursive: true }, async (eventType, filename) => {
		if (isBuilding) {
			needsRebuild = true;
			return;
		}
		isBuilding = true;
		await build(_dirname, false, { clean: false });
		console.log(`[${_package.name}] build succeeded.`);
		if (needsRebuild) {
			await build(_dirname, false, { clean: false });;
			console.log(`[${_package.name}] build succeeded.`);
			needsRebuild = false;
		}
		isBuilding = false;
	});

	// 初回ビルド
	await build(_dirname, false);
	console.log(`[${_package.name}] build succeeded.`);

	await new Promise((resolve, reject) => {
		process.on('SIGHUP', resolve);
		process.on('SIGINT', resolve);
		process.on('SIGTERM', resolve);
		process.on('uncaughtException', reject);
		process.on('exit', resolve);
	}).finally(async () => {
		watcher.close();
		console.log(`[${_package.name}] finish watching.`);
	});
}

watchSrc();
