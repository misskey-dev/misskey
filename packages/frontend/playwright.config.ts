/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './test/e2e',
	reporter: 'list',
	fullyParallel: false,
	workers: 1,
	timeout: 60_000,
	expect: {
		timeout: 10_000,
	},
	outputDir: './test/e2e/artifacts',
	use: {
		locale: 'en-US',
		baseURL: 'http://localhost:61812',
		headless: true,
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
		video: 'off',
	},
	projects: [{
		name: 'chromium',
		use: {
			browserName: 'chromium',
		},
	}],
});
