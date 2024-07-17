import tsParser from '@typescript-eslint/parser';
import sharedConfig from '../shared/eslint.config.js';

export default [
	...sharedConfig,
	{
		ignores: [
			'**/node_modules',
			'built',
			'coverage',
			'jest.config.ts',
			'test',
			'test-d',
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
];
