import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import sharedConfig from '../../shared/eslint.config.js';

export default [
	...sharedConfig,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			globals: {
				...globals.node,
			},
			parserOptions: {
				parser: tsParser,
				project: ['./tsconfig.json'],
				sourceType: 'module',
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
];
