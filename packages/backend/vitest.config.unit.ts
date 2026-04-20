import { defineConfig, mergeConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.js';

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			globalSetup: './test/setup.unit.ts',
			include: ['test/unit/**/*.ts', 'src/**/*.test.ts'],
		},
	}),
);
