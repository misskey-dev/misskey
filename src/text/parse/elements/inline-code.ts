/**
 * Code (inline)
 */

import genHtml from '../core/syntax-highlighter';

export type TextElementInlineCode = {
	type: "inline-code"
	content: string
	code: string
	html: string
};

export default function(text: string) {
	const match = text.match(/^`(.+?)`/);
	if (!match) return null;
	const code = match[0];
	return {
		type: 'inline-code',
		content: code,
		code: code.substr(1, code.length - 2).trim(),
		html: genHtml(code.substr(1, code.length - 2).trim())
	} as TextElementInlineCode;
}
