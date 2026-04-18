import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.js';

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			include: ['./test/e2e/**/*.ts'],
			globalSetup: './test/global-setup.e2e.ts',
			setupFiles: ['./test/setup.e2e.ts'],
		},
	}),
);
