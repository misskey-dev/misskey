module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
	},
	plugins: [
		'@typescript-eslint',
		'import'
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:import/recommended',
		'plugin:import/typescript'
	],
	rules: {
		'indent': ['warn', 'tab', {
			'SwitchCase': 1,
			'MemberExpression': 'off',
			'flatTernaryExpressions': true,
			'ArrayExpression': 'first',
			'ObjectExpression': 'first',
		}],
		'eol-last': ['error', 'always'],
		'semi': ['error', 'always'],
		'quotes': ['warn', 'single'],
		'comma-dangle': ['warn', 'always-multiline'],
		'keyword-spacing': ['error', {
			'before': true,
			'after': true,
		}],
		/* TODO: path aliasを使わないとwarnする
		'no-restricted-imports': ['warn', {
			'patterns': [
			]
		}],
		*/
		'no-multi-spaces': ['error'],
		'no-var': ['error'],
		'prefer-arrow-callback': ['error'],
		'no-throw-literal': ['warn'],
		'no-param-reassign': ['warn'],
		'no-constant-condition': ['warn'],
		'no-empty-pattern': ['warn'],
		'no-async-promise-executor': ['off'],
		'no-useless-escape': ['off'],
		'no-multi-spaces': ['warn'],
		'no-control-regex': ['warn'],
		'no-empty': ['warn'],
		'no-inner-declarations': ['off'],
		'no-sparse-arrays': ['off'],
		'@typescript-eslint/no-var-requires': ['warn'],
		'@typescript-eslint/no-inferrable-types': ['warn'],
		'@typescript-eslint/no-empty-function': ['off'],
		'@typescript-eslint/no-non-null-assertion': ['off'],
		'@typescript-eslint/no-misused-promises': ['error', {
			'checksVoidReturn': false,
		}],
		'import/no-unresolved': ['off'],
		'import/no-default-export': ['warn'],
	},
};
