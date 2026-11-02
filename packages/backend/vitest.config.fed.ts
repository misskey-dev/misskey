import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.js';

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			include: ['test-federation/test/**/*.test.ts'],
			// beforeAll / afterAll で連合の反映 (最大 WAIT_FOR_SLOW_FEDERATION) を待つ
			hookTimeout: 60000,
		},
	}),
);
