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
			'MemberExpression': 1,
			'flatTernaryExpressions': true,
			'ArrayExpression': 'first',
			'ObjectExpression': 'first',
		}],
		'eol-last': ['error', 'always'],
		'semi': ['error', 'always'],
		'semi-spacing': ['error', { 'before': false, 'after': true }],
		'quotes': ['warn', 'single'],
		'comma-dangle': ['warn', 'always-multiline'],
		'comma-spacing': ['error', { 'before': false, 'after': true }],
		'array-bracket-spacing': ['error', 'never'],
		'keyword-spacing': ['error', {
			'before': true,
			'after': true,
		}],
		'key-spacing': ['error', {
			'beforeColon': false,
			'afterColon': true,
		}],
		'arrow-spacing': ['error', {
			'before': true,
			'after': true,
		}],
		'padded-blocks': ['error', 'never'],
		/* TODO: path aliasを使わないとwarnする
		'no-restricted-imports': ['warn', {
			'patterns': [
			]
		}],
		*/
		'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
		'no-multi-spaces': ['error'],
		'no-var': ['error'],
		'prefer-arrow-callback': ['error'],
		'no-throw-literal': ['error'],
		'no-param-reassign': ['warn'],
		'no-constant-condition': ['warn'],
		'no-empty-pattern': ['warn'],
		'no-async-promise-executor': ['off'],
		'no-useless-escape': ['off'],
		'no-multiple-empty-lines': ['error', { 'max': 1 }],
		'no-control-regex': ['warn'],
		'no-empty': ['warn'],
		'no-inner-declarations': ['off'],
		'no-sparse-arrays': ['off'],
		'nonblock-statement-body-position': ['error', 'beside'],
		'object-curly-spacing': ['error', 'always'],
		'space-infix-ops': ['error'],
		'space-before-blocks': ['error', 'always'],
		'@typescript-eslint/no-unnecessary-condition': ['warn'],
		'@typescript-eslint/no-var-requires': ['warn'],
		'@typescript-eslint/no-inferrable-types': ['warn'],
		'@typescript-eslint/no-empty-function': ['off'],
		'@typescript-eslint/no-non-null-assertion': ['warn'],
		'@typescript-eslint/explicit-function-return-type': ['warn'],
		'@typescript-eslint/no-misused-promises': ['error', {
			'checksVoidReturn': false,
		}],
		'@typescript-eslint/consistent-type-imports': 'off',
		'@typescript-eslint/prefer-nullish-coalescing': [
			'error',
		],
		'@typescript-eslint/naming-convention': [
			'error',
			{
				"selector": "typeLike",
				"format": ["PascalCase"]
			},
			{
				"selector": "typeParameter",
				"format": []
			}
		],
		'import/no-unresolved': ['off'],
		'import/no-default-export': ['warn'],
		'import/order': ['warn', {
			'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
		}]
	},
};
