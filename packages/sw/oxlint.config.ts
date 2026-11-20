import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';
import { frontendGlobals } from '../shared/lint-browser.js';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		env: {
			serviceworker: true,
		},
		globals: frontendGlobals,
		ignorePatterns: [
			'built/**/*',
		],
		overrides: [{
			files: ['build.js'],
			env: {
				serviceworker: false,
				node: true,
			},
		}],
	},
});
