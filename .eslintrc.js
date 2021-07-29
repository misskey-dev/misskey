module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		'indent': ['error', 'tab', {
			'SwitchCase': 1,
			'flatTernaryExpressions': true,
		}],
		'eol-last': ['error', 'always'],
		'semi': ['error', 'always'],
		'quotes': ['error', 'single'],
		'keyword-spacing': ['error', {
			'before': true,
			'after': true,
		}],
		'no-multi-spaces': ['error'],
		'no-var': ['error'],
		'prefer-arrow-callback': ['error'],
		'no-throw-literal': ['error'],
		'no-param-reassign': ['warn'],
		'no-constant-condition': ['warn'],
		'no-empty-pattern': ['warn'],
		'@typescript-eslint/no-inferrable-types': ['off'],
	},
};
