import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';
import { frontendJsRules, frontendGlobals } from '../shared/lint-browser.js';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		env: {
			browser: true,
		},
		rules: frontendJsRules,
		globals: frontendGlobals,
		ignorePatterns: [
			'js-built/**/*',
		],
	},
});
