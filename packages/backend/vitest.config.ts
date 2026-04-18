import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export const baseConfig = defineConfig({
	test: {
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			reportsDirectory: 'coverage',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts'],
		},
		restoreMocks: true,
		testTimeout: 60000,
		hookTimeout: 60000,
		teardownTimeout: 60000,
		maxWorkers: 1,
		logHeapUsage: true,
		vmMemoryLimit: 1024,
		maxConcurrency: 32,
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
});

export default baseConfig;
