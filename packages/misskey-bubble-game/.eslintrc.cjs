module.exports = {
	root: true,
	env: {
		node: false,
	},
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
	},
	extends: [
		'../shared/.eslintrc.js',
	],
};
