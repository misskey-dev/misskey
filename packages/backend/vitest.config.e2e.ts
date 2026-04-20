import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.js';

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			include: ['./test/e2e/**/*.ts'],
			globalSetup: './built-test/entry.js',
			setupFiles: ['./test/setup.e2e.ts'],
			reporters: process.env.GITHUB_ACTIONS === 'true' ? ['default', 'hanging-process', 'github-actions'] : ['default', 'hanging-process'],
		},
	}),
);
