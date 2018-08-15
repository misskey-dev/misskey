/**
 * Code (inline)
 */

import genHtml from '../core/syntax-highlighter';

export type TextElementInlineCode = {
	type: 'inline-code'
	content: string
	code: string
	html: string
};

export default function(text: string) {
	const match = text.match(/^`(.+?)`/);
	if (!match) return null;
	if (match[1].includes('´')) return null;
	const code = match[0];
	return {
		type: 'inline-code',
		content: code,
		code: match[1],
		html: genHtml(match[1])
	} as TextElementInlineCode;
}
