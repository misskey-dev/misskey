function escape(text) {
	return text
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;');
}

// 文字数が多い順にソートします
// そうしないと、「function」という文字列が与えられたときに「func」が先にマッチしてしまう可能性があるためです
const _keywords = [
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
	'dim',
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
	'next',
	'end',
	'sub',
	'throw',
	'try',
	'catch',
	'finally',
	'enum',
	'delegate',
	'function',
	'func',
	'fun',
	'fn',
	'return',
	'yield',
	'async',
	'await',
	'require',
	'include',
	'import',
	'imports',
	'export',
	'exports',
	'from',
	'as',
	'using',
	'use',
	'internal',
	'module',
	'namespace',
	'where',
	'select',
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
	'partial',
	'override',
	'extends',
	'implements',
	'constructor'
];

const keywords = _keywords
	.concat(_keywords.map(k => k[0].toUpperCase() + k.substr(1)))
	.concat(_keywords.map(k => k.toUpperCase()))
	.sort((a, b) => b.length - a.length);

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

const elements = [
	// comment
	code => {
		if (code.substr(0, 2) != '//') return null;
		const match = code.match(/^\/\/(.+?)(\n|$)/);
		if (!match) return null;
		const comment = match[0];
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
		if (regexp == '') return null;
		if (regexp[0] == ' ' && regexp[regexp.length - 1] == ' ') return null;

		return {
			html: `<span class="regexp">/${escape(regexp)}/</span>`,
			next: regexp.length + 2
		};
	},

	// label
	code => {
		if (code[0] != '@') return null;
		const match = code.match(/^@([a-zA-Z_-]+?)\n/);
		if (!match) return null;
		const label = match[0];
		return {
			html: `<span class="label">${label}</span>`,
			next: label.length
		};
	},

	// number
	(code, i, source) => {
		const prev = source[i - 1];
		if (prev && /[a-zA-Z]/.test(prev)) return null;
		if (!/^[\-\+]?[0-9\.]+/.test(code)) return null;
		const match = code.match(/^[\-\+]?[0-9\.]+/)[0];
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
export default (source: string, lang?: string) => {
	let code = source;
	let html = '';

	let i = 0;

	function push(token) {
		html += token.html;
		code = code.substr(token.next);
		i += token.next;
	}

	while (code != '') {
		const parsed = elements.some(el => {
			const e = el(code, i, source);
			if (e) {
				push(e);
				return true;
			} else {
				return false;
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
};
