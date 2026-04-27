import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import sharedConfig from '../shared/eslint.config.js';

// eslint-disable-next-line import/no-default-export
export default [
	...sharedConfig,
	{
		files: [
			'**/*.ts',
		],
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
			parserOptions: {
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
			'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
			// window の禁止理由: グローバルスコープと衝突し、予期せぬ結果を招くため
			// e の禁止理由: error や event など、複数のキーワードの頭文字であり分かりにくいため
			'id-denylist': ['error', 'window', 'e'],
			'no-shadow': ['warn'],
		},
	},
	{
		ignores: [
		],
	},
];
