import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		ignorePatterns: [
			'built/**/*',
		],
		overrides: [{
			files: ['src/autogen/**/*.ts', 'src/autogen/**/*.tsx'],
			rules: {
				'@stylistic/indent': 'off',
			},
		}],
	},
});
