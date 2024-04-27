/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import walk from 'ignore-walk';
import Pack from 'tar/lib/pack.js';
import meta from '../package.json' assert { type: "json" };

const cwd = fileURLToPath(new URL('..', import.meta.url));
const ignore = [
	'**/.git/**/*',
	'**/*ignore',
	'**/.gitmodules',
	// Exclude files you don't want to include in the tarball here
];

export default async function build() {
	const mkdirPromise = mkdir(resolve(cwd, 'built', 'tarball'), { recursive: true });
	const pack = new Pack({ cwd, gzip: true });
	const patterns = await walk({ path: cwd, ignoreFiles: ['.gitignore'] });

	for await (const entry of glob.stream(patterns, { cwd, ignore, dot: true })) {
		pack.add(entry);
	}

	pack.end();

	await mkdirPromise;

	pack.pipe(createWriteStream(resolve(cwd, 'built', 'tarball', `misskey-${meta.version}.tar.gz`)));
}
