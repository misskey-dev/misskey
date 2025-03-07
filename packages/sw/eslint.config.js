import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import sharedConfig from '../shared/eslint.config.js';

export default [
	...sharedConfig,
	{
		ignores: ['build.js'],
		languageOptions: {
			globals: {
				...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, 'off'])),
				require: false,
				_DEV_: false,
				_LANGS_: false,
				_VERSION_: false,
				_ENV_: false,
				_PERF_PREFIX_: false,
			},
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parserOptions: {
				parser: tsParser,
				project: ['./tsconfig.json'],
				sourceType: 'module',
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
];
