module.exports = {
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
	},
	extends: [
		'../../shared/.eslintrc.js',
	],
};
