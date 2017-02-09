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
	'var',
	'const',
	'let',
	'mut',
	'if',
	'then',
	'else',
	'switch',
	'case',
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
	'function',
	'func',
	'fn',
	'return',
	'async',
	'await',
	'require',
	'import',
	'export',
	'new',
	'this',
	'class',
	'constructor'
].sort((a, b) => b.length - a.length);

const symbols = [
	'=',
	'+',
	'-',
	'*',
	'/',
	'%',
	'^',
	'&',
	'|',
	'>',
	'<',
	'~'
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

	// string
	code => {
		if (!/^['"`]/.test(code)) return null;
		const begin = code[0];
		let str = begin;
		let thisIsNotAString = false;
		for (i = 1; i < code.length; i++) {
			const char = code[i];
			if (char == '\\') {
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

	// number
	(code, i, source) => {
		const prev = source[i - 1];
		if (prev && /[a-zA-Z]/.test(prev)) return null;
		if (!/^[0-9]+/.test(code)) return null;
		const match = code.match(/^[0-9]+/)[0];
		if (match) {
			return {
				html: `<span class="number">${match}</span>`,
				next: match.length
			};
		} else {
			return null;
		}
	},

	// keyword
	code => {
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
function genHtml(source, lang) {
	let code = source;
	let html = '';

	function push(token) {
		html += token.html;
		code = code.substr(token.next);
	}

	let i = 0;

	while (code != '') {
		const parsed = elements.some(el => {
			const e = el(code, i, source);
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

		i++;
	}

	return html;
}
