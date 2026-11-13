import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.js';

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			include: ['./test/e2e/**/*.ts'],
			globalSetup: './built-test/entry.js',
			setupFiles: ['./test/setup.e2e.ts'],
			server: {
				deps: {
					// テスト用サーバのバンドルはViteのmodule runnerを通さずNodeに直接読み込ませる
					external: [/\/built-test\//],
				},
			},
		},
	}),
);
