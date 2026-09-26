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
					// テスト用サーバのバンドルはViteのmodule runnerを通さずNodeに直接読み込ませる。
					// module runnerで評価するとsourcemapがbase64でコード末尾に埋め込まれ、
					// スタック整形のたびにそれを正規表現で抽出するが、サーバのバンドルでは数百万文字になり
					// Node 26 + カバレッジ計測の環境で RangeError: Maximum call stack size exceeded となる。
					external: [/\/built-test\//],
				},
			},
		},
	}),
);
