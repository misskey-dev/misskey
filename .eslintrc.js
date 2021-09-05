module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
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
		'keyword-spacing': ['error', {
			'before': true,
			'after': true,
		}],
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
		'@typescript-eslint/no-var-requires': ['warn'],
		'@typescript-eslint/no-inferrable-types': ['warn'],
		'@typescript-eslint/no-empty-function': ['off'],
		'@typescript-eslint/no-non-null-assertion': ['off'],
		'import/no-unresolved': ['off'],
		'import/no-default-export': ['warn'],
	},
};
