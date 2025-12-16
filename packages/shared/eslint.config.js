import { fixupPluginRules } from '@eslint/compat';
import stylisticEslint from '@stylistic/eslint-plugin';
import tsParser from "@typescript-eslint/parser";
import globals from 'globals';

const jsRules = {
	'@stylistic/array-bracket-spacing': ['error', 'never'],
	'@stylistic/arrow-spacing': ['error', {
		'before': true,
		'after': true,
	}],
	'@stylistic/brace-style': ['error', '1tbs', {
		'allowSingleLine': true,
	}],
	'@stylistic/comma-dangle': ['warn', 'always-multiline'],
	'@stylistic/comma-spacing': ['error', { 'before': false, 'after': true }],
	'@stylistic/eol-last': ['error', 'always'],
	'@stylistic/key-spacing': ['error', {
		'beforeColon': false,
		'afterColon': true,
	}],
	'@stylistic/keyword-spacing': ['error', {
		'before': true,
		'after': true,
	}],
	'@stylistic/indent': ['warn', 'tab', {
		'SwitchCase': 1,
		'MemberExpression': 1,
		'flatTernaryExpressions': true,
		'ArrayExpression': 'first',
		'ObjectExpression': 'first',
	}],
	'@stylistic/lines-between-class-members': 'off',
	'@stylistic/no-multi-spaces': ['error'],
	'@stylistic/no-multiple-empty-lines': ['error', { 'max': 1 }],
	'@stylistic/object-curly-spacing': ['error', 'always'],
	'@stylistic/padded-blocks': ['error', 'never'],
	'@stylistic/nonblock-statement-body-position': ['error', 'beside'],
	'@stylistic/padding-line-between-statements': [
		'error',
		{ 'blankLine': 'always', 'prev': 'function', 'next': '*' },
		{ 'blankLine': 'always', 'prev': '*', 'next': 'function' },
	],
	'@stylistic/quotes': ['warn', 'single'],
	'@stylistic/semi': ['error', 'always'],
	'@stylistic/semi-spacing': ['error', { 'before': false, 'after': true }],
	'@stylistic/space-before-blocks': ['error', 'always'],
	'@stylistic/space-infix-ops': ['error'],
};

const tsRules = {
	'@stylistic/function-call-spacing': ['error', 'never'],
};

export const typescriptConfig = {
	plugins: {
		'@stylistic': fixupPluginRules(stylisticEslint),
	},
	languageOptions: {
		parser: tsParser,
	},
	rules: {
		...jsRules,
		...tsRules,
	},
};

export default [
	{
		files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.jsx'],
		plugins: {
			'@stylistic': fixupPluginRules(stylisticEslint),
		},
		rules: {
			...jsRules,
		},
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		...typescriptConfig,
	},
	{
		files: ['**/*.cjs'],
		languageOptions: {
			sourceType: 'commonjs',
			parserOptions: {
				sourceType: 'commonjs',
			},
		},
	},
	{
		files: ['**/*.js', '**/*.jsx'],
		languageOptions: {
			parserOptions: {
				sourceType: 'module',
			},
		},
	},
	{
		files: ['build.js'],
		languageOptions: {
			globals: globals.node,
		},
	},
	{
		files: ['**/*.js', '**/*.cjs'],
		rules: {
			'@typescript-eslint/no-var-requires': 'off',
		},
	},
	{
		rules: {
			'no-restricted-imports': ['error', {
				paths: [{ name: 'punycode' }],
			}],
		},
	},
];
