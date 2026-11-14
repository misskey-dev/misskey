import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		env: {
			node: true,
		},
		ignorePatterns: [
			'assets/**/*',
			'built/**/*',
			'built-test/**/*',
			'migration/**/*',
			'test-federation/volumes/**/*',
		],
		rules: {
			'typescript/await-thenable': 'off',
			'no-restricted-globals': ['error', {
				name: '__dirname',
				message: 'Not in ESModule. Use `import.meta.url` instead.',
			}, {
				name: '__filename',
				message: 'Not in ESModule. Use `import.meta.url` instead.',
			}],
		},
	},
});
