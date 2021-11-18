module.exports = {
	root: true,
	env: {
		"node": false
	},
	parser: "vue-eslint-parser",
	parserOptions: {
		"parser": "@typescript-eslint/parser",
		tsconfigRootDir: __dirname,
		//project: ['./tsconfig.json'],
	},
	extends: [
		//"../shared/.eslintrc.js",
		"plugin:vue/vue3-recommended"
	],
	rules: {
		"vue/html-indent": ["warn", "tab", {
			"attribute": 1,
			"baseIndent": 0,
			"closeBracket": 0,
			"alignAttributesVertically": true,
			"ignores": []
		}],
		"vue/html-closing-bracket-spacing": ["warn", {
			"startTag": "never",
			"endTag": "never",
			"selfClosingTag": "never"
		}],
		"vue/multi-word-component-names": "warn",
		"vue/require-v-for-key": "warn",
		"vue/no-unused-components": "warn",
		"vue/valid-v-for": "warn",
		"vue/return-in-computed-property": "warn",
	},
	globals: {
		"require": false,
		"_DEV_": false,
		"_LANGS_": false,
		"_VERSION_": false,
		"_ENV_": false,
		"_PERF_PREFIX_": false,
		"_DATA_TRANSFER_DRIVE_FILE_": false,
		"_DATA_TRANSFER_DRIVE_FOLDER_": false,
		"_DATA_TRANSFER_DECK_COLUMN_": false
	}
}
