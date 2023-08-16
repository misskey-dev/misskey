module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
	},
	extends: [
		'../shared/.eslintrc.js',
	],
};
