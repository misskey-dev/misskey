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
		'@typescript-eslint/no-inferrable-types': ['warn'],
		'import/no-unresolved': ['off'],
		'import/no-default-export': ['warn'],
	},
};
