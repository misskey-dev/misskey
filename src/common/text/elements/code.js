/**
 * Code
 */

const regexp = /```([\s\S]+?)```/;

module.exports = {
	test: x => new RegExp('^' + regexp.source).test(x),
	parse: text => {
		const code = text.match(new RegExp('^' + regexp.source))[0];
		return {
			type: 'code',
			content: code,
			code: code.substr(3, code.length - 6).trim(),
			codeHtml: genHtml(code.substr(3, code.length - 6).trim())
		};
	}
};

function escape(text) {
	return text
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;');
}

// 文字数が多い順にソートします
// そうしないと、「function」という文字列が与えられたときに「func」が先にマッチしてしまう可能性があるためです
const keywords = [
	'true',
	'false',
	'null',
	'nil',
	'undefined',
	'void',
	'var',
	'const',
	'let',
	'mut',
	'if',
	'then',
	'else',
	'switch',
	'match',
	'case',
	'default',
	'for',
	'each',
	'in',
	'while',
	'loop',
	'continue',
	'break',
	'do',
	'goto',
	'end',
	'throw',
	'try',
	'catch',
	'finally',
	'enum',
	'function',
	'func',
	'fn',
	'return',
	'yield',
	'async',
	'await',
	'require',
	'include',
	'import',
	'export',
	'from',
	'using',
	'use',
	'module',
	'struct',
	'union',
	'new',
	'delete',
	'this',
	'super',
	'base',
	'class',
	'interface',
	'abstract',
	'static',
	'public',
	'private',
	'protected',
	'virtual',
	'override',
	'extends',
	'implements',
	'constructor'
].sort((a, b) => b.length - a.length);

const symbols = [
	'=',
	'+',
	'-',
	'*',
	'/',
	'%',
	'~',
	'^',
	'&',
	'|',
	'>',
	'<',
	'!',
	'?'
];

// 変数宣言
const varDef = [
	'var',
	'const',
	'let',
	'mut'
];

const elements = [
	// comment
	code => {
		if (code.substr(0, 2) != '//') return null;
		const comment = code.match(/^\/\/(.+?)\n/)[0];
		return {
			html: `<span class="comment">${escape(comment)}</span>`,
			next: comment.length
		};
	},

	// block comment
	code => {
		const match = code.match(/^\/\*([\s\S]+?)\*\//);
		if (!match) return null;
		return {
			html: `<span class="comment">${escape(match[0])}</span>`,
			next: match[0].length
		};
	},

	// string
	code => {
		if (!/^['"`]/.test(code)) return null;
		const begin = code[0];
		let str = begin;
		let thisIsNotAString = false;
		for (let i = 1; i < code.length; i++) {
			const char = code[i];
			if (char == '\\') {
				str += char;
				str += code[i + 1] || '';
				i++;
				continue;
			} else if (char == begin) {
				str += char;
				break;
			} else if (char == '\n' || i == (code.length - 1)) {
				thisIsNotAString = true;
				break;
			} else {
				str += char;
			}
		}
		if (thisIsNotAString) {
			return null;
		} else {
			return {
				html: `<span class="string">${escape(str)}</span>`,
				next: str.length
			};
		}
	},

	// regexp
	code => {
		if (code[0] != '/') return null;
		let regexp = '';
		let thisIsNotARegexp = false;
		for (let i = 1; i < code.length; i++) {
			const char = code[i];
			if (char == '\\') {
				regexp += char;
				regexp += code[i + 1] || '';
				i++;
				continue;
			} else if (char == '/') {
				break;
			} else if (char == '\n' || i == (code.length - 1)) {
				thisIsNotARegexp = true;
				break;
			} else {
				regexp += char;
			}
		}
		
		if (thisIsNotARegexp) return null;
		if (regexp[0] == ' ' && regexp[regexp.length - 1] == ' ') return null;

		return {
			html: `<span class="regexp">/${escape(regexp)}/</span>`,
			next: regexp.length + 2
		};
	},

	// label
	code => {
		if (code[0] != '@') return null;
		const label = code.match(/^@([a-zA-Z_-]+?)\n/)[0];
		return {
			html: `<span class="label">${label}</span>`,
			next: label.length
		};
	},

	// extract vars
	(code, i, source, vars) => {
		const prev = source[i - 1];
		if (prev && /[a-zA-Z]/.test(prev)) return null;

		const match = varDef.filter(v => code.substr(0, v.length + 1) == v + ' ')[0];

		if (match) {
			const bars = code.substr(match.length + 1).match(/^[a-zA-Z0-9_\-,\s]+/);
			if (bars) {
				bars[0].replace(/,/g, ' ').split(' ').filter(x => x != '').forEach(bar => {
					if (!keywords.some(k => k == bar)) {
						vars.push(bar);
					}
				});
			}
		}

		return null;
	},

	// vars
	(code, i, source, vars) => {
		const prev = source[i - 1];
		// プロパティは変数と認識させないために、
		// 前に . や > (PHPなどではプロパティに -> でアクセスするため) が無いかチェック
		if (prev && /[a-zA-Z\.>]/.test(prev)) return null;

		const match = vars.sort((a, b) => b.length - a.length)
			.filter(v => code.substr(0, v.length) == v)[0];

		if (match) {
			if (/^[a-zA-Z]/.test(code.substr(match.length))) return null;
			return {
				html: `<span class="var">${match}</span>`,
				next: match.length
			};
		} else {
			return null;
		}
	},

	// number
	(code, i, source) => {
		const prev = source[i - 1];
		if (prev && /[a-zA-Z]/.test(prev)) return null;
		if (!/^[\-\+]?[0-9]+/.test(code)) return null;
		const match = code.match(/^[\-\+]?[0-9-]+/)[0];
		if (match) {
			return {
				html: `<span class="number">${match}</span>`,
				next: match.length
			};
		} else {
			return null;
		}
	},

	// nan
	(code, i, source) => {
		const prev = source[i - 1];
		if (prev && /[a-zA-Z]/.test(prev)) return null;
		if (code.substr(0, 3) == 'NaN') {
			return {
				html: `<span class="nan">NaN</span>`,
				next: 3
			};
		} else {
			return null;
		}
	},

	// keyword
	(code, i, source) => {
		const prev = source[i - 1];
		if (prev && /[a-zA-Z]/.test(prev)) return null;

		const match = keywords.filter(k => code.substr(0, k.length) == k)[0];
		if (match) {
			if (/^[a-zA-Z]/.test(code.substr(match.length))) return null;
			return {
				html: `<span class="keyword ${match}">${match}</span>`,
				next: match.length
			};
		} else {
			return null;
		}
	},

	// method
	code => {
		const match = code.match(/^([a-zA-Z_-]+?)\(/);
		if (!match) return null;

		if (match[1] == '-') return null;

		return {
			html: `<span class="method">${match[1]}</span>`,
			next: match[1].length
		};
	},

	// property
	(code, i, source) => {
		const prev = source[i - 1];
		if (prev != '.') return null;

		const match = code.match(/^[a-zA-Z0-9_-]+/);
		if (!match) return null;

		return {
			html: `<span class="property">${match[0]}</span>`,
			next: match[0].length
		};
	},

	// symbol
	code => {
		const match = symbols.filter(s => code[0] == s)[0];
		if (match) {
			return {
				html: `<span class="symbol">${match}</span>`,
				next: 1
			};
		} else {
			return null;
		}
	}
];

// specify lang is todo
function genHtml(source, lang) {
	let code = source;
	let html = '';

	let vars = [];

	let i = 0;

	function push(token) {
		html += token.html;
		code = code.substr(token.next);
		i += token.next;
	}

	while (code != '') {
		const parsed = elements.some(el => {
			const e = el(code, i, source, vars);
			if (e) {
				push(e);
				return true;
			}
		});

		if (!parsed) {
			push({
				html: escape(code[0]),
				next: 1
			});
		}
	}

	return html;
}
