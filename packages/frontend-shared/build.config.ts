/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineBuildConfig } from 'unbuild';
import { replaceTscAliasPaths } from 'tsc-alias';

export default defineBuildConfig({
	entries: [{
		builder: 'mkdist',
		input: './js/',
		outDir: './js-built/',
	}],
	declaration: true,
	sourcemap: true,
	hooks: {
		'build:done': async () => {
			await replaceTscAliasPaths({
				resolveFullPaths: true,
				resolveFullExtension: '.mjs',
				replacers: ['./tscAliasReplacer.cjs'],
			});
		},
	},
});
