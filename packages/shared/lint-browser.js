//@ts-check

/** @type {import('oxlint').OxlintGlobals} */
export const frontendGlobals = {
	_DEV_: 'readonly',
	_LANGS_: 'readonly',
	_VERSION_: 'readonly',
	_ENV_: 'readonly',
	_PREF_PREFIX_: 'readonly',
};

/** @type {import('oxlint').DummyRuleMap} */
export const frontendJsRules = {
	'typescript/no-empty-interface': ['error', {
		allowSingleExtends: true,
	}],
	'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
	// e ... error や event など、複数のキーワードの頭文字であり分かりにくいため
	// window ... グローバルスコープと衝突し、予期せぬ結果を招くため
	'id-denylist': ['error', 'e', 'window'],
	// close ... window.closeと衝突 or 紛らわしい
	// open ... window.openと衝突 or 紛らわしい
	// fetch ... window.fetchと衝突 or 紛らわしい
	// location ... window.locationと衝突 or 紛らわしい
	// document ... window.documentと衝突 or 紛らわしい
	// history ... window.historyと衝突 or 紛らわしい
	// scroll ... window.scrollと衝突 or 紛らわしい
	// setTimeout ... window.setTimeoutと衝突 or 紛らわしい
	// setInterval ... window.setIntervalと衝突 or 紛らわしい
	// clearTimeout ... window.clearTimeoutと衝突 or 紛らわしい
	// clearInterval ... window.clearIntervalと衝突 or 紛らわしい
	'no-restricted-globals': [
		'error',
		{
			'name': 'open',
			'message': 'Use `window.open`.',
		},
		{
			'name': 'close',
			'message': 'Use `window.close`.',
		},
		{
			'name': 'fetch',
			'message': 'Use `window.fetch`.',
		},
		{
			'name': 'location',
			'message': 'Use `window.location`.',
		},
		{
			'name': 'document',
			'message': 'Use `window.document`.',
		},
		{
			'name': 'history',
			'message': 'Use `window.history`.',
		},
		{
			'name': 'scroll',
			'message': 'Use `window.scroll`.',
		},
		{
			'name': 'setTimeout',
			'message': 'Use `window.setTimeout`.',
		},
		{
			'name': 'setInterval',
			'message': 'Use `window.setInterval`.',
		},
		{
			'name': 'clearTimeout',
			'message': 'Use `window.clearTimeout`.',
		},
		{
			'name': 'clearInterval',
			'message': 'Use `window.clearInterval`.',
		},
		{
			'name': 'name',
			'message': 'Use `window.name`. もしくは name という変数名を定義し忘れている',
		},
	],
};

/** @type {import('vize').LinterConfig['rules']} */
export const frontendVizeLinterRules = {
	// 'vue/attributes-order': ['error', {
	// 	alphabetical: false,
	// }], // vize formatter
	'vue/no-mutating-props': 'error',
	'vue/no-use-v-if-with-v-for': 'error',
	'script/no-ref-as-operand': 'error',
	'vue/no-multi-spaces': 'error',
	'vue/no-v-html': 'warn',
	'vue/sfc-element-order': 'error',
	// 'vue/html-indent': ['warn', 'tab', {
	// 	attribute: 1,
	// 	baseIndent: 0,
	// 	closeBracket: 0,
	// 	alignAttributesVertically: true,
	// 	ignores: [],
	// }], // vize formatter
	// 'vue/html-closing-bracket-spacing': ['warn', {
	// 	startTag: 'never',
	// 	endTag: 'never',
	// 	selfClosingTag: 'never',
	// }], // vize formatter
	'vue/multi-word-component-names': 'warn',
	'vue/require-v-for-key': 'warn',
	'vue/no-unused-components': 'warn',
	'vue/no-unused-vars': 'warn',
	'script/no-dupe-keys': 'warn',
	'vue/valid-v-for': 'warn',
	'script/return-in-computed-property': 'warn',
	'type/no-reactivity-loss': 'warn',
	// 'vue/max-attributes-per-line': 'off', // vize formatter
	'vue/html-self-closing': 'error',
	// 'vue/singleline-html-element-content-newline': 'off', // vize formatter
	'vue/v-on-event-hyphenation': 'error',
	'vue/attribute-hyphenation': 'error',
};

/** @type {import('vize').LinterConfig['ruleOptions']} */
export const frontendVizeLinterRuleOptions = {
	'vue/no-mutating-props': {
		shallowOnly: true,
	},
	'vue/sfc-element-order': {
		order: ['template', 'script:not([setup])', 'script[setup]', 'style'],
	},
	'vue/html-self-closing': {
		html: {
			void: 'any',
			normal: 'never',
			component: 'any',
		},
		svg: 'any',
		math: 'any',
	},
	'vue/attribute-hyphenation': 'never',
	'vue/v-on-event-hyphenation': 'never',
};
