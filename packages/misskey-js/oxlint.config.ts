import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		ignorePatterns: [
			'built/**/*',
			'coverage/**/*',
			'test/**/*',
			'test-d/**/*',
			'generator/**/*',
		],
		overrides: [{
			files: ['build.js'],
			env: {
				node: true,
			},
		}, {
			files: ['src/autogen/**/*.ts', 'src/autogen/**/*.tsx'],
			rules: {
				'@stylistic/indent': 'off',
			},
		}],
	},
});
