/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/unit/**/*.ts'],
	},
	resolve: {
		alias: {
			'@': resolve(import.meta.dirname, './src'),
		},
	},
});
