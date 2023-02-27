module.exports = {
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json', './test/tsconfig.json'],
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
		}],
		'no-restricted-globals': [
			'error',
			{
				'name': '__dirname',
				'message': 'Not in ESModule. Use `import.meta.url` instead.'
			},
			{
				'name': '__filename',
				'message': 'Not in ESModule. Use `import.meta.url` instead.'
			}
	]
	},
};
