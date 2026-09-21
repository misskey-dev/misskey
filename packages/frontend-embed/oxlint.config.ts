import { defineMisskeyDevOxlintConfig } from '@misskey-dev/oxlint-fmt-config';
import { frontendJsRules, frontendGlobals, frontendVizeRules } from '../shared/oxlint-browser.js';

export default defineMisskeyDevOxlintConfig({
	overrides: {
		jsPlugins: ['oxlint-plugin-vize'],
		settings: {
			vize: {
				typeAware: true,
			},
		},
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
			files: ['src/**/*.{ts,tsx,vue}'],
			plugins: ['vue'],
			rules: {
				...frontendJsRules,
				...frontendVizeRules,
			},
		}],
	},
});
