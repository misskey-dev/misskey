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
				_DATA_TRANSFER_DRIVE_FILE_: false,
				_DATA_TRANSFER_DRIVE_FOLDER_: false,
				_DATA_TRANSFER_DECK_COLUMN_: false,
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
			// window の禁止理由: グローバルスコープと衝突し、予期せぬ結果を招くため
			// e の禁止理由: error や event など、複数のキーワードの頭文字であり分かりにくいため
			'id-denylist': ['error', 'window', 'e'],
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
			'vue/html-self-closing': 'off',
			'vue/singleline-html-element-content-newline': 'off',
			'vue/v-on-event-hyphenation': ['error', 'never', {
				autofix: true,
			}],
			'vue/attribute-hyphenation': ['error', 'never'],
		},
	},
];
