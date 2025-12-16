import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export const baseConfig = defineConfig({
	plugins: [
		// swcがbuilt内容をトランスパイルすると不具合を起こすため、built配下は除外する
		swc.vite({
			include: [/\.[cm]?tsx?$/],
			exclude: ['/node_modules/', '/\/built\//', '/\/built-test\//'],
		}),
	],
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
