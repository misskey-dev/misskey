module.exports = {
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json'],
	},
	extends: ['../.eslintrc.cjs'],
	env: {
		node: true,
		mocha: true,
	},
};
