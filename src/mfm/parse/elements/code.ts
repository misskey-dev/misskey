/**
 * Code (block)
 */

import genHtml from '../core/syntax-highlighter';

export type TextElementCode = {
	type: 'code'
	content: string
	code: string
	html: string
};

export default function(text: string) {
	const match = text.match(/^```([\s\S]+?)```/);
	if (!match) return null;
	const code = match[0];
	return {
		type: 'code',
		content: code,
		code: match[1],
		html: genHtml(match[1])
	} as TextElementCode;
}
