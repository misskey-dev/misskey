import tsParser from '@typescript-eslint/parser';
import sharedConfig from '../shared/eslint.config.js';

export default [
	...sharedConfig,
	{
		ignores: [
			'**/node_modules',
			'built',
			'coverage',
			'vitest.config.ts',
			'test',
			'test-d',
			'generator',
		],
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
	{
		files: ['src/autogen/**/*.ts', 'src/autogen/**/*.tsx'],
		rules: {
			'@stylistic/indent': 'off',
		},
	},
];
