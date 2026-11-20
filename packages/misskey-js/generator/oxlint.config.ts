import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		overrides: [{
			files: ['built/autogen/**.ts'],
			rules: {
				'@stylistic/indent': 'off',
			},
		}],
	},
});
