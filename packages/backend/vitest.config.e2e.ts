import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.js';

export default mergeConfig(
	baseConfig,
	defineConfig({
		root: resolve(__dirname),
		test: {
			include: ['test/e2e/**/*.ts'],
			globalSetup: './built-test/entry.js',
			setupFiles: ['./test/setup.e2e.ts'],
		},
	}),
);
