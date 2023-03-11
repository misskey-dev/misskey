import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	test: {
		include: [
			'test/unit/**/*.ts',
			'src/**/*.test.ts',
			'test/e2e/**/*.ts',
		],
		hookTimeout: 60000,
	},
});
