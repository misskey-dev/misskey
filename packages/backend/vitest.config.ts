import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Raise the global EventEmitter listener limit before Vitest wires CLI listeners.
EventEmitter.defaultMaxListeners = 20;

export const baseConfig = defineConfig({
	test: {
		dir: import.meta.dirname,
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			reportsDirectory: 'coverage',
			include: ['src/**/*.ts'],
			// 型定義ファイルは実行されるコードを持たないので、常に0%として混ざるのを防ぐ
			exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
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
