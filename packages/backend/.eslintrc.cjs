module.exports = {
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
	},
	extends: [
		'../shared/.eslintrc.js',
	],
	rules: {
		'import/order': ['warn', {
			'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
			'pathGroups': [
				{
					'pattern': '@/**',
					'group': 'external',
					'position': 'after'
				}
			],
		}]
	},
};
