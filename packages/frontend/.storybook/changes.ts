/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import micromatch from 'micromatch';
import main from './main.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

interface Stats {
	readonly modules: readonly {
		readonly id: string;
		readonly name: string;
		readonly reasons: readonly {
			readonly moduleName: string;
		}[];
	}[];
}

await fs.readFile(
	new URL('../storybook-static/preview-stats.json', import.meta.url)
).then((buffer) => {
	const stats: Stats = JSON.parse(buffer.toString());
	const keys = new Set(stats.modules.map((stat) => stat.id));
	const map = new Map(
		Array.from(keys, (key) => [
			key,
			new Set(
				stats.modules
					.filter((stat) => stat.id === key)
					.flatMap((stat) => stat.reasons)
					.map((reason) => reason.moduleName)
			),
		])
	);
	const modules = new Set(
		process.argv
			.slice(2)
			.map((arg) =>
				path.relative(
					path.resolve(__dirname, '..'),
					path.resolve(__dirname, '../../..', arg)
				)
			)
			.map((path) => path.replace(/(?:(?<=\.stories)\.(?:impl|meta)|\.msw)(?=\.ts$)/g, ''))
			.map((path) => (path.startsWith('.') ? path : `./${path}`))
	);
	if (
		micromatch(Array.from(modules), [
			'../../assets/**',
			'../../fluent-emojis/**',
			'../../locales/ja-JP.yml',
			'../../misskey-assets/**',
			'assets/**',
			'public/**',
			'../../pnpm-lock.yaml',
		]).length
	) {
		return;
	}
	for (;;) {
		const oldSize = modules.size;
		for (const module of Array.from(modules)) {
			if (map.has(module)) {
				for (const dependency of Array.from(map.get(module)!)) {
					modules.add(dependency);
				}
			}
		}
		if (modules.size === oldSize) {
			break;
		}
	}
	const stories = micromatch(
		Array.from(modules),
		main.stories.map((story) => `./${path.relative('..', story)}`)
	);
	if (stories.length) {
		for (const story of stories) {
			process.stdout.write(` --only-story-files ${story}`);
		}
	} else {
		process.stdout.write(` --skip`);
	}
});
