import {
	defineMisskeyDevOxlintConfig,
	oxlintJsRules,
	oxlintTsRules,
	oxlintStylisticRules,
} from '@misskey-dev/oxlint-fmt-config';
import { frontendJsRules, frontendGlobals } from '../shared/lint-browser.js';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		env: {
			browser: true,
		},
		globals: frontendGlobals,
		ignorePatterns: [
			'.storybook/**/*',
			'src/**/*.stories.{ts,tsx}',
			'src/**/*.stories.impl.{ts,tsx}',
		],
		overrides: [{
			files: ['build.ts'],
			env: {
				node: true,
			},
		}, {
			files: ['src/**/*.{vue,ts,tsx}'],
			plugins: ['vue'],
			rules: {
				...oxlintJsRules,
				...oxlintTsRules,
				...oxlintStylisticRules,
				...frontendJsRules,
			},
		}, {
			files: ['src/**/*.{js,jsx}'],
			rules: {
				...oxlintJsRules,
				...oxlintStylisticRules,
				...frontendJsRules,
			},
		}],
	},
});
