import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import parser from 'vue-eslint-parser';
import pluginVue from 'eslint-plugin-vue';
import pluginMisskey from '@misskey-dev/eslint-plugin';
import sharedConfig from '../shared/eslint.config.js';

export default [
	...sharedConfig,
	{
		files: ['src/**/*.vue'],
		...pluginMisskey.configs.typescript,
	},
	...pluginVue.configs['flat/recommended'],
	{
		files: ['src/**/*.{ts,vue}'],
		ignores: ['**/*.stories.ts'],
		languageOptions: {
			globals: {
				...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, 'off'])),
				...globals.browser,

				// Node.js
				module: false,
				require: false,
				__dirname: false,

				// Misskey
				_DEV_: false,
				_LANGS_: false,
				_VERSION_: false,
				_ENV_: false,
				_PERF_PREFIX_: false,
			},
			parser,
			parserOptions: {
				extraFileExtensions: ['.vue'],
				parser: tsParser,
				project: ['./tsconfig.json'],
				sourceType: 'module',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-empty-interface': ['error', {
				allowSingleExtends: true,
			}],
			// defineExposeが誤検知されてしまう
			'@typescript-eslint/no-unused-expressions': 'off',
			'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
			// window ... グローバルスコープと衝突し、予期せぬ結果を招くため
			// e ... error や event など、複数のキーワードの頭文字であり分かりにくいため
			// close ... window.closeと衝突 or 紛らわしい
			// open ... window.openと衝突 or 紛らわしい
			// fetch ... window.fetchと衝突 or 紛らわしい
			// location ... window.locationと衝突 or 紛らわしい
			// document ... window.documentと衝突 or 紛らわしい
			// history ... window.historyと衝突 or 紛らわしい
			// scroll ... window.scrollと衝突 or 紛らわしい
			// setTimeout ... window.setTimeoutと衝突 or 紛らわしい
			// setInterval ... window.setIntervalと衝突 or 紛らわしい
			// clearTimeout ... window.clearTimeoutと衝突 or 紛らわしい
			// clearInterval ... window.clearIntervalと衝突 or 紛らわしい
			'id-denylist': ['warn', 'window', 'e', 'close', 'open', 'fetch', 'location', 'document', 'history', 'scroll', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'],
			'no-restricted-globals': [
				'error',
				{
					'name': 'open',
					'message': 'Use `window.open`.',
				},
				{
					'name': 'close',
					'message': 'Use `window.close`.',
				},
				{
					'name': 'fetch',
					'message': 'Use `window.fetch`.',
				},
				{
					'name': 'location',
					'message': 'Use `window.location`.',
				},
				{
					'name': 'document',
					'message': 'Use `window.document`.',
				},
				{
					'name': 'history',
					'message': 'Use `window.history`.',
				},
				{
					'name': 'scroll',
					'message': 'Use `window.scroll`.',
				},
				{
					'name': 'setTimeout',
					'message': 'Use `window.setTimeout`.',
				},
				{
					'name': 'setInterval',
					'message': 'Use `window.setInterval`.',
				},
				{
					'name': 'clearTimeout',
					'message': 'Use `window.clearTimeout`.',
				},
				{
					'name': 'clearInterval',
					'message': 'Use `window.clearInterval`.',
				},
				{
					'name': 'name',
					'message': 'Use `window.name`. もしくは name という変数名を定義し忘れている',
				},
			],
			'no-shadow': ['warn'],
			'vue/attributes-order': ['error', {
				alphabetical: false,
			}],
			'vue/no-use-v-if-with-v-for': ['error', {
				allowUsingIterationVar: false,
			}],
			'vue/no-ref-as-operand': 'error',
			'vue/no-multi-spaces': ['error', {
				ignoreProperties: false,
			}],
			'vue/no-v-html': 'warn',
			'vue/order-in-components': 'error',
			'vue/html-indent': ['warn', 'tab', {
				attribute: 1,
				baseIndent: 0,
				closeBracket: 0,
				alignAttributesVertically: true,
				ignores: [],
			}],
			'vue/html-closing-bracket-spacing': ['warn', {
				startTag: 'never',
				endTag: 'never',
				selfClosingTag: 'never',
			}],
			'vue/multi-word-component-names': 'warn',
			'vue/require-v-for-key': 'warn',
			'vue/no-unused-components': 'warn',
			'vue/no-unused-vars': 'warn',
			'vue/no-dupe-keys': 'warn',
			'vue/valid-v-for': 'warn',
			'vue/return-in-computed-property': 'warn',
			'vue/no-setup-props-reactivity-loss': 'warn',
			'vue/max-attributes-per-line': 'off',
			'vue/html-self-closing': ['error', {
				html: {
					void: 'any',
					normal: 'never',
					component: 'any',
				},
				svg: 'any',
				math: 'any',
			}],
			'vue/singleline-html-element-content-newline': 'off',
			'vue/v-on-event-hyphenation': ['error', 'never', {
				autofix: true,
			}],
			'vue/attribute-hyphenation': ['error', 'never'],
			'vue/no-mutating-props': ['error', {
				shallowOnly: true,
			}],
		},
	},
];
