/*
* For a detailed explanation regarding each configuration property and type check, visit:
* https://jestjs.io/docs/en/configuration.html
*/

const base = require('./jest.config.cjs')

module.exports = {
	...base,
	testMatch: [
		"<rootDir>/test/unit/**/*.ts",
		"<rootDir>/src/**/*.test.ts",
	],
};
