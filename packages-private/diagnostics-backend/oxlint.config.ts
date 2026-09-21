import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		env: {
			node: true,
		},
		ignorePatterns: [
			'**/__snapshots__/**/*',
			'test/fixtures/**/*',
		],
	},
});
