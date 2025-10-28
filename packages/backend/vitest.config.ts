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
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
});

export default baseConfig;
