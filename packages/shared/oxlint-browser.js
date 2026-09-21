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

/** @type {import('oxlint').DummyRuleMap} */
export const frontendVizeRules = {
	// 'vue/attributes-order': ['error', {
	// 	alphabetical: false,
	// }], // vize formatter
	'vize/vue/no-mutating-props': ['error', {
		shallowOnly: true,
	}],
	'vize/vue/no-use-v-if-with-v-for': 'error',
	'vize/script/no-ref-as-operand': 'error',
	'vize/vue/no-multi-spaces': 'error',
	'vize/vue/no-v-html': 'warn',
	'vize/vue/sfc-element-order': ['error', {
		order: ['template', 'script:not([setup])', 'script[setup]', 'style'],
	}],
	// 'vize/vue/html-indent': ['warn', 'tab', {
	// 	attribute: 1,
	// 	baseIndent: 0,
	// 	closeBracket: 0,
	// 	alignAttributesVertically: true,
	// 	ignores: [],
	// }], // vize formatter
	// 'vize/vue/html-closing-bracket-spacing': ['warn', {
	// 	startTag: 'never',
	// 	endTag: 'never',
	// 	selfClosingTag: 'never',
	// }], // vize formatter
	'vize/vue/multi-word-component-names': 'warn',
	'vize/vue/require-v-for-key': 'warn',
	'vize/vue/no-unused-components': 'warn',
	'vize/vue/no-unused-vars': 'warn',
	'vize/script/no-dupe-keys': 'warn',
	'vize/vue/valid-v-for': 'warn',
	'vize/script/return-in-computed-property': 'warn',
	'vize/type/no-reactivity-loss': 'warn',
	// 'vize/vue/max-attributes-per-line': 'off', // vize formatter
	'vize/vue/html-self-closing': ['error', {
		html: {
			void: 'any',
			normal: 'never',
			component: 'any',
		},
		svg: 'any',
		math: 'any',
	}],
	// 'vize/vue/singleline-html-element-content-newline': 'off', // vize formatter
	'vize/vue/v-on-event-hyphenation': ['error', 'never'],
	'vize/vue/attribute-hyphenation': ['error', 'never'],
};
