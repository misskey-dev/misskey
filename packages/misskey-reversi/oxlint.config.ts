import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		ignorePatterns: [
			'built/**/*',
		],
		overrides: [{
			files: ['build.js'],
			env: {
				node: true,
			},
		}],
	},
});
