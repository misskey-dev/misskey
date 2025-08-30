import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.ts'],
		coverage: {
			exclude: [
				...configDefaults.coverage.exclude!,
				'src/autogen/**/*',
				'generator/**/*',
				'built/**/*',
				'test-d/**/*',
				'build.js',
			],
		}
	},
});
